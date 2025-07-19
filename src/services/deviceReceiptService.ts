import api from './api';

interface DeviceReceiptConfirmationData {
  confirmationImages: string[];
  notes?: string;
}

interface DeviceReceipt {
  id: string;
  transfer_id: string;
  device_id: string;
  school_id: string;
  confirmation_images: string[];
  notes: string;
  created_at: string;
}

const deviceReceiptService = {
  /**
   * Confirm receipt of a device
   * @param transferId The ID of the transfer
   * @param data The confirmation data including images
   * @returns Promise with the confirmation result
   */
  confirmDeviceReceipt: async (transferId: string, data: DeviceReceiptConfirmationData) => {
    const response = await api.post(`/device-receipts/${transferId}`, data);
    return response.data;
  },

  /**
   * Get receipt details for a transfer
   * @param transferId The ID of the transfer
   * @returns Promise with the receipt details
   */
  getReceiptDetails: async (transferId: string) => {
    const response = await api.get(`/device-receipts/${transferId}`);
    return response.data;
  }
};

export default deviceReceiptService;