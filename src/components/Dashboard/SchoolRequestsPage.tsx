import React, { useState } from 'react';
import RequestStatusList from './RequestStatusList';
import RequestProgressTracker from './RequestProgressTracker';

const SchoolRequestsPage: React.FC = () => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yêu cầu thiết bị</h1>
      
      {selectedRequestId ? (
        <RequestProgressTracker 
          requestId={selectedRequestId} 
          onBack={() => setSelectedRequestId(null)} 
        />
      ) : (
        <RequestStatusList onSelectRequest={setSelectedRequestId} />
      )}
    </div>
  );
};

export default SchoolRequestsPage;