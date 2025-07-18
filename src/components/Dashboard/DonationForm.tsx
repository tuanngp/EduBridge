import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUploader from '../common/ImageUploader';
import apiService from '../../services/api';

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

  const deviceTypes = [
    'Laptop',
    'Desktop Computer',
    'Tablet',
    'Smartphone',
    'Monitor',
    'Keyboard',
    'Mouse',
    'Printer',
    'Projector',
    'Webcam',
    'Other',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submit New Donation</h2>
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
              <option value="">Select device type</option>
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
              <option value="new">New</option>
              <option value="used-good">Used - Good condition</option>
              <option value="used-fair">Used - Fair condition</option>
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
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Provide detailed information about the device, including specifications, accessories included, pickup location, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Images
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
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Submit Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationForm;