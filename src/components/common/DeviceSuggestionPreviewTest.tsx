import React from 'react';
import DeviceSuggestionPreview from './DeviceSuggestionPreview';

const DeviceSuggestionPreviewTest: React.FC = () => {
  const handleSelectDevice = (device: any) => {
    console.log('Selected device:', device);
    alert(`Selected device: ${device.name}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Device Suggestion Preview Test</h1>
      <p className="mb-4 text-gray-600">
        This page demonstrates the device suggestion preview functionality. 
        Fill in the form below to see matching devices based on your requirements.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
        <h2 className="font-medium text-blue-800 mb-2">How it works</h2>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Enter your device requirements (device type is required)</li>
          <li>Click "Find Matching Devices" to see available matches</li>
          <li>Results are sorted by match score (higher is better)</li>
          <li>Click on any device to select it</li>
        </ol>
      </div>
      
      <DeviceSuggestionPreview onSelectDevice={handleSelectDevice} />
    </div>
  );
};

export default DeviceSuggestionPreviewTest; 