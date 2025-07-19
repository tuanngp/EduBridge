import React, { useState, useEffect } from 'react';
import VoucherVerification from './common/VoucherVerification';

interface VerifyVoucherProps {
  qrCode?: string;
}

const VerifyVoucher: React.FC<VerifyVoucherProps> = ({ qrCode }) => {
  const [verificationComplete, setVerificationComplete] = useState<boolean>(false);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Xác thực phiếu vận chuyển EduBridge</h1>
        <p className="text-gray-600">
          Quét mã QR hoặc nhập mã xác thực để xác nhận việc nhận thiết bị
        </p>
      </div>

      <VoucherVerification 
        qrCode={qrCode} 
        onVerified={() => setVerificationComplete(true)} 
      />

      {verificationComplete && (
        <div className="mt-8 text-center">
          <p className="text-green-600 font-medium">
            Cảm ơn bạn đã xác nhận việc nhận thiết bị!
          </p>
          <p className="mt-2 text-gray-600">
            Thông tin đã được cập nhật trong hệ thống.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerifyVoucher;