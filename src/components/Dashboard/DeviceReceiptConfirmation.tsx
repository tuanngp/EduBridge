import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import deviceReceiptService from '../../services/deviceReceiptService';
import api from '../../services/api';

interface DeviceReceiptConfirmationProps {
  transferId: string;
  onConfirmationComplete?: () => void;
}

const DeviceReceiptConfirmation: React.FC<DeviceReceiptConfirmationProps> = ({ 
  transferId, 
  onConfirmationComplete 
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      
      // Add all selected files to the form data
      Array.from(e.target.files).forEach((file) => {
        formData.append('images', file);
      });
      
      formData.append('folder', 'device_receipts');
      
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const uploadedImages = response.data.images.map((img: any) => img.url);
      setImages([...images, ...uploadedImages]);
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError('Không thể tải lên hình ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      // Clear the input value to allow uploading the same file again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setError('Vui lòng tải lên ít nhất một hình ảnh xác nhận');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await deviceReceiptService.confirmDeviceReceipt(transferId, {
        confirmationImages: images,
        notes: notes.trim() || undefined
      });
      
      setSuccess(true);
      
      if (onConfirmationComplete) {
        onConfirmationComplete();
      }
    } catch (err: any) {
      console.error('Error confirming device receipt:', err);
      setError(err.response?.data?.error || 'Không thể xác nhận nhận thiết bị. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="text-green-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-green-700">Xác nhận nhận thiết bị thành công</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Cảm ơn bạn đã xác nhận đã nhận thiết bị. Thông tin này đã được cập nhật trong hệ thống.
        </p>
        <button
          onClick={onConfirmationComplete}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Xác nhận nhận thiết bị</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh xác nhận <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Vui lòng tải lên hình ảnh thiết bị đã nhận để xác nhận việc nhận thiết bị
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Hình ảnh xác nhận ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <label className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <>
                  <Camera size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Thêm ảnh</span>
                </>
              )}
            </label>
          </div>
          
          <p className="text-xs text-gray-500">
            Tối đa 5 hình ảnh, mỗi hình không quá 5MB
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú (tùy chọn)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Nhập ghi chú về tình trạng thiết bị khi nhận, nếu có"
          ></textarea>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || uploading || images.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận đã nhận thiết bị'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeviceReceiptConfirmation;