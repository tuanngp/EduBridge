import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, RefreshCw } from 'lucide-react';
import voucherService from '../../services/voucherService';

interface TransferVoucherProps {
  transferId: string;
  onClose?: () => void;
}

interface Voucher {
  id: string;
  transfer_id: string;
  qr_code: string;
  status: 'active' | 'used' | 'expired';
  expiry_date: string;
  created_at: string;
  updated_at: string;
  transfers?: {
    id: string;
    device_id: string;
    donor_id: string;
    school_id: string;
    status: string;
    devices: {
      name: string;
      device_type: string;
    };
    donors: {
      organization: string;
    };
    schools: {
      school_name: string;
    };
  };
}

const TransferVoucher: React.FC<TransferVoucherProps> = ({ transferId, onClose }) => {
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if voucher exists for this transfer
        const response = await voucherService.getVoucherByTransferId(transferId);
        setVoucher(response.voucher);
        setQrCodeUrl(response.qr_code_url);
      } catch (err) {
        console.error('Error fetching voucher:', err);
        setError('Không thể tải phiếu vận chuyển. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [transferId]);

  const createVoucher = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await voucherService.createVoucher(transferId);
      setVoucher(response.voucher);
      setQrCodeUrl(response.qr_code_url);
    } catch (err) {
      console.error('Error creating voucher:', err);
      setError('Không thể tạo phiếu vận chuyển. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a canvas element to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('.qr-code-svg') as SVGSVGElement;
    
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `edubridge-voucher-${transferId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Tạo phiếu vận chuyển</h3>
        <p className="mb-4">Chưa có phiếu vận chuyển cho thiết bị này. Tạo phiếu vận chuyển với mã QR để theo dõi quá trình vận chuyển.</p>
        <button
          onClick={createVoucher}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Tạo phiếu vận chuyển
        </button>
      </div>
    );
  }

  const isExpired = new Date(voucher.expiry_date) < new Date() || voucher.status === 'expired';
  const isUsed = voucher.status === 'used';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none">
      <div className="flex justify-between items-start mb-4 print:hidden">
        <h3 className="text-lg font-semibold">Phiếu vận chuyển</h3>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            title="In phiếu vận chuyển"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            title="Tải mã QR"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-2">EduBridge - Phiếu vận chuyển</h4>
            {voucher.transfers && (
              <>
                <p className="mb-1"><span className="font-medium">Thiết bị:</span> {voucher.transfers.devices.name}</p>
                <p className="mb-1"><span className="font-medium">Loại:</span> {voucher.transfers.devices.device_type}</p>
                <p className="mb-1"><span className="font-medium">Người quyên góp:</span> {voucher.transfers.donors.organization}</p>
                <p className="mb-1"><span className="font-medium">Trường học:</span> {voucher.transfers.schools.school_name}</p>
                <p className="mb-1"><span className="font-medium">Ngày tạo:</span> {formatDate(voucher.created_at)}</p>
                <p className="mb-1"><span className="font-medium">Hết hạn:</span> {formatDate(voucher.expiry_date)}</p>
                <p className="mb-1">
                  <span className="font-medium">Trạng thái:</span>{' '}
                  <span className={`font-medium ${isUsed ? 'text-gray-500' : isExpired ? 'text-red-500' : 'text-green-500'}`}>
                    {isUsed ? 'Đã sử dụng' : isExpired ? 'Hết hạn' : 'Còn hiệu lực'}
                  </span>
                </p>
              </>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex justify-center">
            <div className={`p-3 bg-white rounded-lg ${isUsed || isExpired ? 'opacity-50' : ''}`}>
              <QRCodeSVG
                value={qrCodeUrl}
                size={150}
                className="qr-code-svg"
                level="H"
                includeMargin={true}
              />
              {(isUsed || isExpired) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-70 px-2 py-1 rounded text-sm font-bold text-red-600">
                    {isUsed ? 'ĐÃ SỬ DỤNG' : 'HẾT HẠN'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Phiếu vận chuyển này được sử dụng để xác nhận việc chuyển giao thiết bị. Người nhận vui lòng quét mã QR để xác nhận đã nhận thiết bị.</p>
      </div>
    </div>
  );
};

export default TransferVoucher;