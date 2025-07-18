import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import RequestStatusDisplay from './RequestStatusDisplay';

interface Request {
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
}

interface RequestStatusListProps {
  onSelectRequest?: (requestId: string) => void;
}

const RequestStatusList: React.FC<RequestStatusListProps> = ({ onSelectRequest }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch requests
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/schools/needs');
      setRequests(response.data.needs || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRequests();

    // Set up real-time updates (simulated with polling for now)
    const intervalId = setInterval(() => {
      fetchRequests();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Filter requests
  const filteredRequests = requests.filter(request => {
    // Filter by status
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }

    // Filter by priority
    if (filterPriority !== 'all' && request.priority !== filterPriority) {
      return false;
    }

    // Search by device type or description
    if (searchTerm && !request.device_type.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !request.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Yêu cầu thiết bị</h2>
        <p className="text-sm text-gray-600 mt-1">Theo dõi trạng thái các yêu cầu thiết bị của bạn</p>
      </div>

      {/* Filters and search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo loại thiết bị hoặc mô tả"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex space-x-3">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="matched">Đã ghép nối</option>
                <option value="in-transit">Đang vận chuyển</option>
                <option value="delivered">Đã giao hàng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">Tất cả mức độ ưu tiên</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={fetchRequests}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Không tìm thấy yêu cầu nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredRequests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{request.device_type} ({request.quantity})</h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{request.description}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <RequestStatusDisplay
                    status={request.status}
                    createdAt={request.created_at}
                    updatedAt={request.updated_at}
                    priority={request.priority}
                  />
                </div>
                <div className="mt-3 md:mt-0 md:ml-4 flex space-x-4">
                  <button
                    onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedRequest === request.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>
                  {onSelectRequest && (
                    <button
                      onClick={() => onSelectRequest(request.id)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Xem đầy đủ
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {selectedRequest === request.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <RequestStatusDisplay
                    status={request.status}
                    createdAt={request.created_at}
                    updatedAt={request.updated_at}
                    matchedAt={request.matched_at}
                    inTransitAt={request.in_transit_at}
                    deliveredAt={request.delivered_at}
                    priority={request.priority}
                    isDetailed={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestStatusList;