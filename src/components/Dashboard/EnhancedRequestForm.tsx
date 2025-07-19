import React, { useState, useEffect } from 'react';
import { X, Search, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';

interface EnhancedRequestFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

interface DeviceSuggestion {
  id: string;
  name: string;
  device_type: string;
  condition: string;
  quantity: number;
  description: string;
  images: string[];
  matchScore: number;
  donors?: {
    organization: string;
  };
  users?: {
    name: string;
  };
}

const EnhancedRequestForm: React.FC<EnhancedRequestFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    device_type: '',
    quantity: '1',
    description: '',
    priority: 'medium',
    min_condition: '',
    specifications: {}
  });

  const [suggestedDevices, setSuggestedDevices] = useState<DeviceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const conditionOptions = [
    { value: '', label: 'Any condition' },
    { value: 'new', label: 'New only' },
    { value: 'used-good', label: 'Good condition or better' },
  ];

  // Fetch device suggestions when form data changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if we have at least a device type
      if (!formData.device_type) {
        setSuggestedDevices([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post('/api/device-suggestions/preview', {
          device_type: formData.device_type,
          quantity: parseInt(formData.quantity),
          description: formData.description,
          priority: formData.priority,
          min_condition: formData.min_condition || null,
          specifications: formData.specifications
        });

        setSuggestedDevices(response.data.matchingDevices || []);
      } catch (err) {
        console.error('Error fetching device suggestions:', err);
        setError('Failed to fetch device suggestions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Use a debounce to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.device_type, formData.quantity, formData.priority, formData.min_condition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'New';
      case 'used-good': return 'Good';
      case 'used-fair': return 'Fair';
      default: return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used-good': return 'bg-blue-100 text-blue-800';
      case 'used-fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submit Device Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="p-6 border-r border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="device_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type *
                </label>
                <select
                  id="device_type"
                  name="device_type"
                  required
                  value={formData.device_type}
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
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Needed *
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
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="min_condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Condition
                </label>
                <select
                  id="min_condition"
                  name="min_condition"
                  value={formData.min_condition}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {conditionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
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
                  placeholder="Describe why you need these devices, how they will be used, any specific requirements, etc."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>

          {/* Suggestions Section */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Available Matching Devices
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                These devices match your requirements and are currently available
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : suggestedDevices.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No matching devices found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.device_type 
                    ? "Try adjusting your requirements or check back later" 
                    : "Select a device type to see matching devices"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {suggestedDevices.map((device) => (
                  <div 
                    key={device.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(device.condition)}`}>
                          {getConditionLabel(device.condition)}
                        </span>
                        <span className={`ml-2 text-sm font-semibold ${getMatchScoreColor(device.matchScore)}`}>
                          {device.matchScore}% match
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{device.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>{' '}
                        <span className="font-medium">{device.device_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>{' '}
                        <span className="font-medium">{device.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Donor:</span>{' '}
                        <span className="font-medium">
                          {device.donors?.organization || device.users?.name || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                    
                    {device.images && device.images.length > 0 && (
                      <div className="mt-3 flex space-x-2 overflow-x-auto">
                        {device.images.slice(0, 3).map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`${device.name} image ${index + 1}`}
                            className="h-16 w-16 object-cover rounded-md"
                          />
                        ))}
                        {device.images.length > 3 && (
                          <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 text-sm">
                            +{device.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {suggestedDevices.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <Check className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Submit your request to see more details
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    After submitting, you'll be able to view full details and request specific devices
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRequestForm;