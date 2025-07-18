import React from 'react';
import { Clock, CheckCircle, Truck, Package, AlertTriangle, Calendar } from 'lucide-react';

interface RequestStatusDisplayProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
  matchedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  priority: string;
  isDetailed?: boolean;
}

const RequestStatusDisplay: React.FC<RequestStatusDisplayProps> = ({
  status,
  createdAt,
  updatedAt,
  matchedAt,
  inTransitAt,
  deliveredAt,
  priority,
  isDetailed = false
}) => {
  // Format date to a readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'matched':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in-transit':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'matched':
        return <CheckCircle className="h-5 w-5" />;
      case 'in-transit':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
      case 'completed':
        return <Package className="h-5 w-5" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'matched':
        return 'Đã ghép nối';
      case 'in-transit':
        return 'Đang vận chuyển';
      case 'delivered':
        return 'Đã giao hàng';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Khẩn cấp';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  // Simple status badge for compact display
  if (!isDetailed) {
    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          <span className="ml-1">{getStatusLabel(status)}</span>
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
          {getPriorityLabel(priority)}
        </span>
      </div>
    );
  }

  // Calculate progress percentage based on status
  const getProgressPercentage = () => {
    switch (status) {
      case 'pending':
        return 25;
      case 'matched':
        return 50;
      case 'in-transit':
        return 75;
      case 'delivered':
      case 'completed':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span className="ml-1.5">{getStatusLabel(status)}</span>
          </span>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(priority)}`}>
          <AlertTriangle className={priority === 'urgent' ? 'h-4 w-4 mr-1' : 'hidden'} />
          {getPriorityLabel(priority)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className={`h-2.5 rounded-full ${status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} 
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
            <Clock className="h-3 w-3 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Yêu cầu được tạo</p>
            <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${matchedAt ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center mt-0.5`}>
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${matchedAt ? 'text-gray-900' : 'text-gray-500'}`}>Ghép nối với thiết bị</p>
            <p className="text-xs text-gray-500">{matchedAt ? formatDate(matchedAt) : 'Đang chờ'}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${inTransitAt ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center mt-0.5`}>
            <Truck className="h-3 w-3 text-white" />
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${inTransitAt ? 'text-gray-900' : 'text-gray-500'}`}>Đang vận chuyển</p>
            <p className="text-xs text-gray-500">{inTransitAt ? formatDate(inTransitAt) : 'Đang chờ'}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className={`flex-shrink-0 h-5 w-5 rounded-full ${deliveredAt ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center mt-0.5`}>
            <Package className="h-3 w-3 text-white" />
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${deliveredAt ? 'text-gray-900' : 'text-gray-500'}`}>Đã nhận thiết bị</p>
            <p className="text-xs text-gray-500">{deliveredAt ? formatDate(deliveredAt) : 'Đang chờ'}</p>
          </div>
        </div>
      </div>

      {/* Last updated */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center text-xs text-gray-500">
        <Calendar className="h-4 w-4 mr-1" />
        Cập nhật lần cuối: {formatDate(updatedAt || createdAt)}
      </div>
    </div>
  );
};

export default RequestStatusDisplay;