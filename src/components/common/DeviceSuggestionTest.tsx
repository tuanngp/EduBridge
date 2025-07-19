import React, { useState } from 'react';
import { analyzeDeviceDescription } from '../../services/deviceSuggestionService';
import { Lightbulb } from 'lucide-react';

const DeviceSuggestionTest: React.FC = () => {
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof analyzeDeviceDescription> | null>(null);
  const [serverSuggestions, setServerSuggestions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (description.length < 10) {
      setError('Please enter at least 10 characters for analysis');
      return;
    }

    setError(null);
    
    // Client-side analysis
    const clientSuggestion = analyzeDeviceDescription(description);
    setSuggestions(clientSuggestion);
    
    // Server-side analysis
    setIsLoading(true);
    fetch('/api/suggestions/device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ description })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Server error');
        }
        return response.json();
      })
      .then(data => {
        setServerSuggestions(data.suggestion);
      })
      .catch(err => {
        setError('Error fetching server suggestions: ' + err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Device Suggestion Test</h2>
      
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Device Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
          placeholder="Enter a detailed description of a device (e.g., 'MacBook Pro 2019 with 16GB RAM and 512GB SSD in good condition')"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Description'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client-side suggestions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Client-side Analysis</h3>
          </div>
          
          {suggestions ? (
            <div>
              <div className="mb-2">
                <span className="font-medium">Confidence Score:</span> {suggestions.confidence}%
              </div>
              
              {suggestions.deviceType && (
                <div className="mb-2">
                  <span className="font-medium">Device Type:</span> {suggestions.deviceType}
                </div>
              )}
              
              {suggestions.condition && (
                <div className="mb-2">
                  <span className="font-medium">Condition:</span> {suggestions.condition}
                </div>
              )}
              
              {suggestions.specifications && Object.keys(suggestions.specifications).length > 0 && (
                <div>
                  <span className="font-medium">Specifications:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.entries(suggestions.specifications).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No suggestions available. Enter a description and click "Analyze Description".</p>
          )}
        </div>
        
        {/* Server-side suggestions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Server-side Analysis</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : serverSuggestions ? (
            <div>
              <div className="mb-2">
                <span className="font-medium">Confidence Score:</span> {serverSuggestions.confidence}%
              </div>
              
              {serverSuggestions.deviceType && (
                <div className="mb-2">
                  <span className="font-medium">Device Type:</span> {serverSuggestions.deviceType}
                </div>
              )}
              
              {serverSuggestions.condition && (
                <div className="mb-2">
                  <span className="font-medium">Condition:</span> {serverSuggestions.condition}
                </div>
              )}
              
              {serverSuggestions.specifications && Object.keys(serverSuggestions.specifications).length > 0 && (
                <div>
                  <span className="font-medium">Specifications:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.entries(serverSuggestions.specifications).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No server suggestions available yet.</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Sample Descriptions to Try</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>MacBook Pro 2019 with 16GB RAM and 512GB SSD in good condition</li>
          <li>Dell XPS 13 laptop, i7 processor, 8GB memory, Windows 10, lightly used</li>
          <li>iPhone 12 Pro 128GB, excellent condition with original box and charger</li>
          <li>Samsung 27-inch LED monitor, 4K resolution, like new</li>
          <li>HP LaserJet printer, used but working perfectly</li>
        </ul>
      </div>
    </div>
  );
};

export default DeviceSuggestionTest;