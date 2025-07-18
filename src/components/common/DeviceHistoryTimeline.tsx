import React from 'react';
import DeviceStatusBadge from './DeviceStatusBadge';

export interface DeviceHistoryItem {
  id: string;
  deviceId: string;
  status: string;
  description: string;
  timestamp: string;
  performedBy: {
    id: string;
    name: string;
  };
}

interface DeviceHistoryTimelineProps {
  history: DeviceHistoryItem[];
  isLoading?: boolean;
}

const DeviceHistoryTimeline: React.FC<DeviceHistoryTimelineProps> = ({ 
  history,
  isLoading = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">Không có lịch sử thiết bị</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((item, index) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {index < history.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <div className="relative px-1">
                    <div className="h-8 w-8 bg-gray-100 rounded-full ring-8 ring-white flex items-center justify-center">
                      {getStatusIcon(item.status)}
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <DeviceStatusBadge status={item.status} size="sm" />
                      <span className="ml-2 font-medium text-gray-900">{item.description}</span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <div>{formatDate(item.timestamp)}</div>
                    <div className="text-xs text-gray-400">bởi {item.performedBy.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <span className="text-yellow-500">⏳</span>;
    case 'approved':
      return <span className="text-green-500">✓</span>;
    case 'rejected':
      return <span className="text-red-500">✗</span>;
    case 'reserved':
      return <span className="text-blue-500">🔒</span>;
    case 'in-transit':
      return <span className="text-purple-500">🚚</span>;
    case 'delivered':
      return <span className="text-teal-500">📦</span>;
    default:
      return <span className="text-gray-500">❓</span>;
  }
};

export default DeviceHistoryTimeline;