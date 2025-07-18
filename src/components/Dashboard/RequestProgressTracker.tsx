import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, Truck, Package, AlertTriangle, Calendar, ArrowLeft } from 'lucide-react';

interface RequestProgressTrackerProps {
  requestId: string;
  onBack?: () => void;
}

interface RequestDetail {
  id: string;
  device_type: string;
  quantity: number;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  matched_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  specifications?: Record<string, string>;
  min_condition?: string;
  matched_device?: {
    id: string;
    name: string;
    device_type: string;
    condition: string;
    donor: {
      name: string;
      organization?: string;
    };
  };
}

const RequestProgressTracker: React.FC<RequestProgressTrackerProps> = ({ requestId, onBack }) => {
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/schools/needs/${requestId}`);
        setRequest(response.data.need);
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('Không thể tải thông tin chi tiết yêu cầu. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequestDetails();

    // Set up real-time updates (simulated with polling for now)
    const intervalId = setInterval(() => {
      fetchRequestDetails();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(intervalId);
  }, [requestId]);

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

  // Get condition label
  const getConditionLabel = (condition?: string) => {
    switch (condition) {
      case 'new':
        return 'Mới';
      case 'used-good':
        return 'Đã qua sử dụng - Tốt';
      case 'used-fair':
        return 'Đã qua sử dụng - Khá';
      default:
        return condition || 'Không xác định';
    }
  };

  // Calculate progress percentage based on status
  const getProgressPercentage = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <p className="text-sm text-red-600">{error || 'Không tìm thấy thông tin yêu cầu'}</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </button>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {request.device_type} ({request.quantity})
            </h2>
            <p className="mt-1 text-sm text-gray-600">{request.description}</p>
          </div>
          <div className="mt-3 md:mt-0 flex space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusLabel(request.status)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
              <AlertTriangle className={request.priority === 'urgent' ? 'h-4 w-4 mr-1' : 'hidden'} />
              {getPriorityLabel(request.priority)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tiến độ yêu cầu</h3>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className={`h-3 rounded-full ${request.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} 
            style={{ width: `${getProgressPercentage(request.status)}%` }}
          ></div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 h-full w-0.5 bg-gray-200"></div>
            
            {/* Created */}
            <div className="flex items-start relative">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 pt-1.5">
                <h4 className="text-lg font-medium text-gray-900">Yêu cầu được tạo</h4>
                <p className="text-sm text-gray-500 mt-1">{formatDate(request.created_at)}</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Yêu cầu của bạn đã được tạo và đang chờ xử lý.</p>
                </div>
              </div>
            </div>

            {/* Matched */}
            <div className="flex items-start relative mt-8">
              <div className={`flex-shrink-0 h-16 w-16 rounded-full ${
                ['matched', 'in-transit', 'delivered', 'completed'].includes(request.status) 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              } flex items-center justify-center`}>
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 pt-1.5">
                <h4 className={`text-lg font-medium ${
                  ['matched', 'in-transit', 'delivered', 'completed'].includes(request.status) 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>Ghép nối với thiết bị</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {request.matched_at ? formatDate(request.matched_at) : 'Đang chờ'}
                </p>
                {request.matched_device && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h5 className="font-medium text-blue-800">Thiết bị được ghép nối:</h5>
                    <div className="mt-1 text-sm">
                      <p><span className="text-gray-600">Tên:</span> {request.matched_device.name}</p>
                      <p><span className="text-gray-600">Loại:</span> {request.matched_device.device_type}</p>
                      <p><span className="text-gray-600">Tình trạng:</span> {getConditionLabel(request.matched_device.condition)}</p>
                      <p><span className="text-gray-600">Người quyên góp:</span> {
                        request.matched_device.donor.organization || request.matched_device.donor.name || 'Ẩn danh'
                      }</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* In Transit */}
            <div className="flex items-start relative mt-8">
              <div className={`flex-shrink-0 h-16 w-16 rounded-full ${
                ['in-transit', 'delivered', 'completed'].includes(request.status) 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              } flex items-center justify-center`}>
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 pt-1.5">
                <h4 className={`text-lg font-medium ${
                  ['in-transit', 'delivered', 'completed'].includes(request.status) 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>Đang vận chuyển</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {request.in_transit_at ? formatDate(request.in_transit_at) : 'Đang chờ'}
                </p>
                {['in-transit', 'delivered', 'completed'].includes(request.status) && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Thiết bị đang được vận chuyển đến trường của bạn.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivered */}
            <div className="flex items-start relative mt-8">
              <div className={`flex-shrink-0 h-16 w-16 rounded-full ${
                ['delivered', 'completed'].includes(request.status) 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              } flex items-center justify-center`}>
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 pt-1.5">
                <h4 className={`text-lg font-medium ${
                  ['delivered', 'completed'].includes(request.status) 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>Đã nhận thiết bị</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {request.delivered_at ? formatDate(request.delivered_at) : 'Đang chờ'}
                </p>
                {['delivered', 'completed'].includes(request.status) && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Thiết bị đã được giao thành công đến trường của bạn.</p>
                    {request.status === 'delivered' && (
                      <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Xác nhận đã nhận thiết bị
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request details */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết yêu cầu</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Loại thiết bị:</span>
                <span className="font-medium">{request.device_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số lượng:</span>
                <span className="font-medium">{request.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mức độ ưu tiên:</span>
                <span className="font-medium">{getPriorityLabel(request.priority)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tình trạng tối thiểu:</span>
                <span className="font-medium">{getConditionLabel(request.min_condition)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium">{formatDate(request.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cập nhật lần cuối:</span>
                <span className="font-medium">{formatDate(request.updated_at || request.created_at)}</span>
              </div>
            </div>
          </div>

          {request.specifications && Object.keys(request.specifications).length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Thông số kỹ thuật yêu cầu</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(request.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
          <p className="text-sm text-gray-600">{request.description}</p>
        </div>
      </div>
    </div>
  );
};

export default RequestProgressTracker;