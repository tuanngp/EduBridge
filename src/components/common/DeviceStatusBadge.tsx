import React from 'react';

interface DeviceStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
}

const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  withLabel = true 
}) => {
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Đang chờ duyệt',
          icon: '⏳'
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-800',
          label: 'Đã duyệt',
          icon: '✓'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800',
          label: 'Đã từ chối',
          icon: '✗'
        };
      case 'reserved':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Đã đặt trước',
          icon: '🔒'
        };
      case 'in-transit':
        return {
          color: 'bg-purple-100 text-purple-800',
          label: 'Đang vận chuyển',
          icon: '🚚'
        };
      case 'delivered':
        return {
          color: 'bg-teal-100 text-teal-800',
          label: 'Đã giao',
          icon: '📦'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          label: status.charAt(0).toUpperCase() + status.slice(1),
          icon: '❓'
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${statusInfo.color}`}>
      <span className="mr-1">{statusInfo.icon}</span>
      {withLabel && statusInfo.label}
    </span>
  );
};

export default DeviceStatusBadge;