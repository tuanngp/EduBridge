import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImagePreviewModal from '../common/ImagePreviewModal';

interface DeviceDetailProps {
  device: {
    id: string;
    name: string;
    description: string;
    device_type: string;
    condition: string;
    quantity: number;
    images?: string[];
    status: string;
    created_at: string;
  };
  onClose: () => void;
}

const DeviceDetail: React.FC<DeviceDetailProps> = ({ device, onClose }) => {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openImagePreview = (index: number) => {
    setCurrentImageIndex(index);
    setPreviewModalOpen(true);
  };

  const closeImagePreview = () => {
    setPreviewModalOpen(false);
  };

  const goToPreviousImage = () => {
    if (!device.images || device.images.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? device.images!.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    if (!device.images || device.images.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === device.images!.length - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{device.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Images Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
              {device.images && device.images.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <img
                      src={device.images[0]}
                      alt={device.name}
                      className="w-full h-64 object-cover rounded-lg cursor-pointer"
                      onClick={() => openImagePreview(0)}
                    />
                  </div>
                  
                  {device.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {device.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${device.name} ${index + 1}`}
                          className={`h-16 w-16 object-cover rounded cursor-pointer ${
                            index === 0 ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => openImagePreview(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div>
              <div className="mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(device.status)}`}>
                  {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Device Type</h4>
                  <p className="mt-1">{device.device_type}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                  <p className="mt-1">{device.condition}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                  <p className="mt-1">{device.quantity}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date Added</h4>
                  <p className="mt-1">{formatDate(device.created_at)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 whitespace-pre-line">{device.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>

      {previewModalOpen && device.images && (
        <ImagePreviewModal
          images={device.images}
          currentIndex={currentImageIndex}
          onClose={closeImagePreview}
          onPrevious={goToPreviousImage}
          onNext={goToNextImage}
        />
      )}
    </div>
  );
};

export default DeviceDetail;