import React, { useState } from 'react';
import { apiService } from '../../services/api';
import DeviceStatusBadge from './DeviceStatusBadge';

interface DeviceSuggestionPreviewProps {
  onSelectDevice?: (device: any) => void;
}

const DeviceSuggestionPreview: React.FC<DeviceSuggestionPreviewProps> = ({ onSelectDevice }) => {
  const [deviceType, setDeviceType] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [minCondition, setMinCondition] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [matchingDevices, setMatchingDevices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle specification changes
  const handleSpecChange = (key: string, value: string) => {
    setSpecifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.previewDeviceSuggestions({
        device_type: deviceType,
        quantity,
        description,
        specifications,
        min_condition: minCondition || undefined,
        priority
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data?.matchingDevices) {
        setMatchingDevices(response.data.matchingDevices);
      } else {
        setMatchingDevices([]);
      }
    } catch (err) {
      setError('Failed to fetch device suggestions');
      console.error('Error fetching device suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Device Suggestion Preview</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">
            Device Type*
          </label>
          <select
            id="deviceType"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a device type</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop Computer">Desktop Computer</option>
            <option value="Tablet">Tablet</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Monitor">Monitor</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Mouse">Mouse</option>
            <option value="Printer">Printer</option>
            <option value="Projector">Projector</option>
            <option value="Webcam">Webcam</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe your device needs"
          />
        </div>

        <div>
          <label htmlFor="minCondition" className="block text-sm font-medium text-gray-700">
            Minimum Condition
          </label>
          <select
            id="minCondition"
            value={minCondition}
            onChange={(e) => setMinCondition(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Any condition</option>
            <option value="new">New</option>
            <option value="used-good">Used - Good</option>
            <option value="used-fair">Used - Fair</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Specifications</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ram" className="block text-xs text-gray-500">RAM</label>
                <input
                  type="text"
                  id="ram"
                  value={specifications.RAM || ''}
                  onChange={(e) => handleSpecChange('RAM', e.target.value)}
                  placeholder="e.g., 8 GB"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="storage" className="block text-xs text-gray-500">Storage</label>
                <input
                  type="text"
                  id="storage"
                  value={specifications.Storage || ''}
                  onChange={(e) => handleSpecChange('Storage', e.target.value)}
                  placeholder="e.g., 256 GB SSD"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="processor" className="block text-xs text-gray-500">Processor</label>
                <input
                  type="text"
                  id="processor"
                  value={specifications.Processor || ''}
                  onChange={(e) => handleSpecChange('Processor', e.target.value)}
                  placeholder="e.g., Intel i5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="os" className="block text-xs text-gray-500">Operating System</label>
                <input
                  type="text"
                  id="os"
                  value={specifications['Operating System'] || ''}
                  onChange={(e) => handleSpecChange('Operating System', e.target.value)}
                  placeholder="e.g., Windows 10"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !deviceType}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Finding matches...' : 'Find Matching Devices'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {matchingDevices.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Matching Devices ({matchingDevices.length})</h3>
          <div className="space-y-4">
            {matchingDevices.map((device) => (
              <div 
                key={device.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectDevice && onSelectDevice(device)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{device.name}</h4>
                    <p className="text-sm text-gray-600">{device.device_type} - {device.donors?.organization || 'Unknown Donor'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DeviceStatusBadge status={device.condition} />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Match: {device.matchScore}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{device.description}</p>
                {device.specifications && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Specs:</span> {typeof device.specifications === 'string' 
                      ? device.specifications 
                      : Object.entries(device.specifications).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {matchingDevices.length === 0 && !loading && !error && deviceType && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md">
          <p>No matching devices found. Try adjusting your requirements.</p>
        </div>
      )}
    </div>
  );
};

export default DeviceSuggestionPreview; 