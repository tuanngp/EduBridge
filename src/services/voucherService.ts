import api from './api';

/**
 * Service for interacting with voucher API
 */
export const voucherService = {
  /**
   * Create a new voucher for a transfer
   * @param transferId - ID of the transfer
   * @returns Promise with voucher data
   */
  createVoucher: async (transferId: string) => {
    const response = await api.post('/vouchers', { transfer_id: transferId });
    return response.data;
  },

  /**
   * Get voucher by transfer ID
   * @param transferId - ID of the transfer
   * @returns Promise with voucher data
   */
  getVoucherByTransferId: async (transferId: string) => {
    const response = await api.get(`/vouchers/transfer/${transferId}`);
    return response.data;
  },

  /**
   * Verify voucher by QR code
   * @param qrCode - QR code identifier
   * @returns Promise with voucher verification result
   */
  verifyVoucher: async (qrCode: string) => {
    const response = await api.get(`/vouchers/verify/${qrCode}`);
    return response.data;
  },

  /**
   * Mark voucher as used
   * @param voucherId - ID of the voucher
   * @returns Promise with updated voucher data
   */
  useVoucher: async (voucherId: string) => {
    const response = await api.put(`/vouchers/${voucherId}/use`);
    return response.data;
  }
};

export default voucherService;