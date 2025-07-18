import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import voucherService from '../../services/voucherService';

interface VoucherVerificationProps {
  qrCode?: string;
  onVerified?: () => void;
}

const VoucherVerification: React.FC<VoucherVerificationProps> = ({ qrCode: initialQrCode, onVerified }) => {
  const [qrCode, setQrCode] = useState<string>(initialQrCode || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!qrCode.trim()) {
      setError('Vui lòng nhập mã QR');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await voucherService.verifyVoucher(qrCode);
      setVerificationResult(response);
      
      if (onVerified) {
        onVerified();
      }
    } catch (err: any) {
      console.error('Error verifying voucher:', err);
      setError(err.response?.data?.error || 'Không thể xác thực phiếu vận chuyển');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!verificationResult?.voucher?.id) return;
    
    try {
      setLoading(true);
      await voucherService.useVoucher(verificationResult.voucher.id);
      setVerificationResult({
        ...verificationResult,
        voucher: {
          ...verificationResult.voucher,
          status: 'used'
        }
      });
    } catch (err: any) {
      console.error('Error marking voucher as used:', err);
      setError(err.response?.data?.error || 'Không thể đánh dấu phiếu vận chuyển đã sử dụng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Xác thực phiếu vận chuyển</h3>
      
      {!verificationResult && (
        <>
          <div className="mb-4">
            <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-1">
              Mã QR
            </label>
            <input
              type="text"
              id="qrCode"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mã QR từ phiếu vận chuyển"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </>
      )}

      {verificationResult && (
        <div>
          {verificationResult.is_valid ? (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="text-green-500 mr-2" size={24} />
                <span className="text-green-700 font-medium">Phiếu vận chuyển hợp lệ</span>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 mt-3">
                <h4 className="font-medium mb-2">Thông tin phiếu vận chuyển</h4>
                
                {verificationResult.voucher.transfers && (
                  <>
                    <p className="mb-1 text-sm"><span className="font-medium">Thiết bị:</span> {verificationResult.voucher.transfers.devices.name}</p>
                    <p className="mb-1 text-sm"><span className="font-medium">Loại:</span> {verificationResult.voucher.transfers.devices.device_type}</p>
                    <p className="mb-1 text-sm"><span className="font-medium">Người quyên góp:</span> {verificationResult.voucher.transfers.donors.organization}</p>
                    <p className="mb-1 text-sm"><span className="font-medium">Trường học:</span> {verificationResult.voucher.transfers.schools.school_name}</p>
                    <p className="mb-1 text-sm"><span className="font-medium">Ngày tạo:</span> {formatDate(verificationResult.voucher.created_at)}</p>
                    <p className="mb-1 text-sm"><span className="font-medium">Hết hạn:</span> {formatDate(verificationResult.voucher.expiry_date)}</p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Trạng thái:</span>{' '}
                      <span className={`font-medium ${verificationResult.voucher.status === 'used' ? 'text-gray-500' : 'text-green-500'}`}>
                        {verificationResult.voucher.status === 'used' ? 'Đã sử dụng' : 'Còn hiệu lực'}
                      </span>
                    </p>
                  </>
                )}
              </div>

              {verificationResult.voucher.status !== 'used' && (
                <button
                  onClick={handleMarkAsUsed}
                  disabled={loading}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đã nhận thiết bị'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center mb-4">
              <XCircle className="text-red-500 mr-2" size={24} />
              <span className="text-red-700 font-medium">Phiếu vận chuyển không hợp lệ hoặc đã hết hạn</span>
            </div>
          )}

          <button
            onClick={() => {
              setVerificationResult(null);
              setQrCode('');
              setError(null);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Xác thực phiếu khác
          </button>
        </div>
      )}
    </div>
  );
};

export default VoucherVerification;