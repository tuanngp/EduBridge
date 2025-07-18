import React, { useState, useEffect } from 'react';
import { Truck, Package, School, Calendar, FileText, QrCode } from 'lucide-react';
import TransferVoucher from '../common/TransferVoucher';
import VoucherVerification from '../common/VoucherVerification';
import api from '../../services/api';

interface TransferDetailProps {
  transferId: string;
  userRole: 'donor' | 'school' | 'admin';
}

interface Transfer {
  id: string;
  device_id: string;
  donor_id: string;
  school_id: string;
  message: string;
  status: string;
  notes: string;
  received_images: string[];
  created_at: string;
  updated_at: string;
  devices: {
    id: string;
    name: string;
    description: string;
    device_type: string;
    condition: string;
    images: string[];
  };
  donors: {
    organization: string;
    phone: string;
  };
  schools: {
    school_name: string;
    contact_person: string;
    phone: string;
    address: string;
  };
}

const TransferDetail: React.FC<TransferDetailProps> = ({ transferId, userRole }) => {
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoucher, setShowVoucher] = useState<boolean>(false);
  const [showVerification, setShowVerification] = useState<boolean>(false);

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/transfers/${transferId}`);
        setTransfer(response.data.transfer);
      } catch (err) {
        console.error('Error fetching transfer:', err);
        setError('Không thể tải thông tin chuyển giao. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [transferId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Đang chờ' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Từ chối' },
      in_transit: { color: 'bg-purple-100 text-purple-800', label: 'Đang vận chuyển' },
      delivered: { color: 'bg-indigo-100 text-indigo-800', label: 'Đã giao' },
      received: { color: 'bg-green-100 text-green-800', label: 'Đã nhận' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || 'Không tìm thấy thông tin chuyển giao'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chi tiết chuyển giao</h2>
          <div>{getStatusBadge(transfer.status)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Package className="mr-2" size={20} />
              Thông tin thiết bị
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2"><span className="font-medium">Tên thiết bị:</span> {transfer.devices.name}</p>
              <p className="mb-2"><span className="font-medium">Loại thiết bị:</span> {transfer.devices.device_type}</p>
              <p className="mb-2"><span className="font-medium">Tình trạng:</span> {transfer.devices.condition}</p>
              <p className="mb-2"><span className="font-medium">Mô tả:</span> {transfer.devices.description}</p>
              
              {transfer.devices.images && transfer.devices.images.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Hình ảnh:</p>
                  <div className="flex flex-wrap gap-2">
                    {transfer.devices.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Thiết bị ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <School className="mr-2" size={20} />
              Thông tin trường học
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2"><span className="font-medium">Tên trường:</span> {transfer.schools.school_name}</p>
              <p className="mb-2"><span className="font-medium">Người liên hệ:</span> {transfer.schools.contact_person}</p>
              <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {transfer.schools.phone}</p>
              <p className="mb-2"><span className="font-medium">Địa chỉ:</span> {transfer.schools.address}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Truck className="mr-2" size={20} />
            Thông tin chuyển giao
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p className="mb-2"><span className="font-medium">Người quyên góp:</span> {transfer.donors.organization}</p>
              <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {transfer.donors.phone}</p>
              <p className="mb-2"><span className="font-medium">Ngày tạo:</span> {formatDate(transfer.created_at)}</p>
              <p className="mb-2"><span className="font-medium">Cập nhật:</span> {formatDate(transfer.updated_at)}</p>
            </div>
            
            {transfer.message && (
              <div className="mt-3">
                <p className="font-medium">Tin nhắn:</p>
                <p className="mt-1 text-gray-700">{transfer.message}</p>
              </div>
            )}
            
            {transfer.notes && (
              <div className="mt-3">
                <p className="font-medium">Ghi chú:</p>
                <p className="mt-1 text-gray-700">{transfer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(userRole === 'donor' || userRole === 'admin') && (
            <button
              onClick={() => setShowVoucher(!showVoucher)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <QrCode className="mr-2" size={18} />
              {showVoucher ? 'Ẩn phiếu vận chuyển' : 'Hiển thị phiếu vận chuyển'}
            </button>
          )}
          
          {(userRole === 'school' || userRole === 'admin') && (
            <button
              onClick={() => setShowVerification(!showVerification)}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <FileText className="mr-2" size={18} />
              {showVerification ? 'Ẩn xác thực phiếu' : 'Xác thực phiếu vận chuyển'}
            </button>
          )}
        </div>
      </div>

      {showVoucher && (
        <div className="p-6 border-t border-gray-200">
          <TransferVoucher transferId={transferId} />
        </div>
      )}

      {showVerification && (
        <div className="p-6 border-t border-gray-200">
          <VoucherVerification />
        </div>
      )}
    </div>
  );
};

export default TransferDetail;