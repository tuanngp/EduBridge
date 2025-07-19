import React, { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import ImageUploader from '../common/ImageUploader';
import apiService from '../../services/api';
import { analyzeDeviceDescription } from '../../services/deviceSuggestionService';

interface DonationFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const DonationForm: React.FC<DonationFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deviceType: '',
    condition: 'new',
    quantity: '1',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{
    deviceType?: string;
    condition?: string;
    specifications?: Record<string, string>;
    confidence: number;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const deviceTypes = [
    'Laptop',
    'Máy tính bàn',
    'Máy tính bảng',
    'Điện thoại thông minh',
    'Màn hình',
    'Bàn phím',
    'Chuột',
    'Máy in',
    'Máy chiếu',
    'Webcam',
    'Khác',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      let imageUrls: string[] = [];
      
      // Upload images if there are any
      if (imageFiles.length > 0) {
        const response = await apiService.uploadImages(imageFiles, 'devices');
        if (response.data && response.data.urls) {
          imageUrls = response.data.urls;
        } else {
          throw new Error('Failed to upload images');
        }
      }
      
      // Submit form data with image URLs
      onSubmit({
        ...formData,
        images: imageUrls,
        device_type: formData.deviceType, // Map to API expected format
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  // Add debounce function for description analysis
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Analyze description for suggestions
  const analyzeDescription = async (description: string) => {
    if (description.length < 10) {
      setSuggestions(null);
      return;
    }

    try {
      setIsSuggesting(true);
      
      // First try client-side analysis for immediate feedback
      const clientSuggestion = analyzeDeviceDescription(description);
      
      // If confidence is high enough, show immediately
      if (clientSuggestion.confidence > 50) {
        setSuggestions(clientSuggestion);
        setShowSuggestions(true);
      }
      
      // Then get server-side analysis for more accurate results
      const response = await apiService.getDeviceSuggestions(description);
      if (response.data?.suggestion) {
        setSuggestions(response.data.suggestion);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting device suggestions:', error);
      // If server request fails, fall back to client-side analysis
      const fallbackSuggestion = analyzeDeviceDescription(description);
      if (fallbackSuggestion.confidence > 30) {
        setSuggestions(fallbackSuggestion);
        setShowSuggestions(true);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  // Create debounced version of analyzeDescription
  const debouncedAnalyzeDescription = debounce(analyzeDescription, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // If description changes, analyze it for suggestions
    if (name === 'description' && value.length >= 10) {
      debouncedAnalyzeDescription(value);
    }
  };
  
  // Apply suggestions to form data
  const applySuggestions = () => {
    if (!suggestions) return;
    
    const updates: Partial<typeof formData> = {};
    
    if (suggestions.deviceType && !formData.deviceType) {
      updates.deviceType = suggestions.deviceType;
    }
    
    if (suggestions.condition) {
      updates.condition = suggestions.condition;
    }
    
    if (suggestions.specifications && Object.keys(suggestions.specifications).length > 0) {
      // If we have specifications, update the name if it's empty
      if (!formData.name) {
        const specs = suggestions.specifications;
        let suggestedName = '';
        
        if (suggestions.deviceType) {
          suggestedName = suggestions.deviceType;
          
          // Add year if available
          if (specs['Year']) {
            suggestedName += ` ${specs['Year']}`;
          }
          
          // Add processor if available
          if (specs['Processor']) {
            suggestedName += ` with ${specs['Processor']}`;
          }
          
          // Add RAM if available
          if (specs['RAM']) {
            suggestedName += `, ${specs['RAM']}`;
          }
          
          // Add storage if available
          if (specs['Storage']) {
            suggestedName += `, ${specs['Storage']}`;
          }
        }
        
        if (suggestedName) {
          updates.name = suggestedName;
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
      
      // Hide suggestions after applying
      setShowSuggestions(false);
    }
  };
  
  // Dismiss suggestions
  const dismissSuggestions = () => {
    setShowSuggestions(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gửi quyên góp</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Device Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="e.g., MacBook Pro 13-inch"
            />
          </div>

          <div>
            <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Device Type *
            </label>
            <select
              id="deviceType"
              name="deviceType"
              required
              value={formData.deviceType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Chọn loại thiết bị</option>
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition *
            </label>
            <select
              id="condition"
              name="condition"
              required
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="new">Mới</option>
              <option value="used-good">Đã qua sử dụng - Tình trạng tốt</option>
              <option value="used-fair">Đã qua sử dụng - Tình trạng khá</option>
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <div className="relative">
                         <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Cung cấp thông tin chi tiết về thiết bị, bao gồm thông số kỹ thuật, phụ kiện đi kèm, địa điểm nhận hàng, v.v."
              />
              {isSuggesting && (
                <div className="absolute right-3 top-3 text-blue-500">
                  <div className="animate-pulse">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Suggestions panel */}
            {showSuggestions && suggestions && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-700">Chúng tôi đã tìm thấy một số gợi ý dựa trên mô tả của bạn</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={applySuggestions}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={dismissSuggestions}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {suggestions.deviceType && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Loại thiết bị:</span>
                      <span className="font-medium">{suggestions.deviceType}</span>
                    </div>
                  )}
                  
                  {suggestions.condition && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Tình trạng:</span>
                      <span className="font-medium">
                        {suggestions.condition === 'new' ? 'Mới' : 
                         suggestions.condition === 'used-good' ? 'Đã qua sử dụng - Tình trạng tốt' : 
                         'Đã qua sử dụng - Tình trạng khá'}
                      </span>
                    </div>
                  )}
                  
                  {suggestions.specifications && Object.keys(suggestions.specifications).length > 0 && (
                    <div className="mt-1">
                      <span className="text-gray-600">Specifications:</span>
                      <div className="ml-2 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(suggestions.specifications).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="text-gray-600 mr-1">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh thiết bị
            </label>
            <ImageUploader 
              onImagesChange={setImageFiles} 
              maxImages={5}
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              disabled={isUploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isUploading}
            >
              {isUploading ? 'Đang tải lên...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationForm;