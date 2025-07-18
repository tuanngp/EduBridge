import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

/**
 * Service for managing transfer vouchers with QR codes
 */
class VoucherService {
  /**
   * Create a new transfer voucher with QR code
   * @param {string} transferId - ID of the transfer
   * @returns {Promise<Object>} - Created voucher
   */
  async createVoucher(transferId) {
    try {
      // Get transfer details to verify it exists
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .select(`
          *,
          devices(*),
          donors(*),
          schools(*)
        `)
        .eq('id', transferId)
        .single();

      if (transferError || !transfer) {
        throw new Error('Transfer not found');
      }

      // Generate a unique QR code identifier
      const qrCodeId = this.generateQRCodeId();
      
      // Set expiry date to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create voucher in database
      const { data: voucher, error } = await supabase
        .from('transfer_vouchers')
        .insert([{
          id: uuidv4(),
          transfer_id: transferId,
          qr_code: qrCodeId,
          status: 'active',
          expiry_date: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create voucher: ${error.message}`);
      }

      return voucher;
    } catch (error) {
      console.error('Create voucher error:', error);
      throw error;
    }
  }

  /**
   * Get voucher by transfer ID
   * @param {string} transferId - ID of the transfer
   * @returns {Promise<Object>} - Voucher
   */
  async getVoucherByTransferId(transferId) {
    try {
      const { data: voucher, error } = await supabase
        .from('transfer_vouchers')
        .select(`
          *,
          transfers(
            *,
            devices(*),
            donors(*),
            schools(*)
          )
        `)
        .eq('transfer_id', transferId)
        .single();

      if (error) {
        throw new Error(`Failed to get voucher: ${error.message}`);
      }

      return voucher;
    } catch (error) {
      console.error('Get voucher error:', error);
      throw error;
    }
  }

  /**
   * Get voucher by QR code
   * @param {string} qrCode - QR code identifier
   * @returns {Promise<Object>} - Voucher
   */
  async getVoucherByQRCode(qrCode) {
    try {
      const { data: voucher, error } = await supabase
        .from('transfer_vouchers')
        .select(`
          *,
          transfers(
            *,
            devices(*),
            donors(*),
            schools(*)
          )
        `)
        .eq('qr_code', qrCode)
        .single();

      if (error) {
        throw new Error(`Failed to get voucher: ${error.message}`);
      }

      return voucher;
    } catch (error) {
      console.error('Get voucher by QR code error:', error);
      throw error;
    }
  }

  /**
   * Update voucher status
   * @param {string} voucherId - ID of the voucher
   * @param {string} status - New status (active, used, expired)
   * @returns {Promise<Object>} - Updated voucher
   */
  async updateVoucherStatus(voucherId, status) {
    try {
      const validStatuses = ['active', 'used', 'expired'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const { data: voucher, error } = await supabase
        .from('transfer_vouchers')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', voucherId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update voucher: ${error.message}`);
      }

      return voucher;
    } catch (error) {
      console.error('Update voucher status error:', error);
      throw error;
    }
  }

  /**
   * Generate a unique QR code identifier
   * @returns {string} - QR code identifier
   */
  generateQRCodeId() {
    // Generate a random string for QR code
    const randomBytes = crypto.randomBytes(16);
    const timestamp = Date.now().toString();
    
    // Combine random bytes and timestamp for uniqueness
    const qrCodeId = `${randomBytes.toString('hex')}-${timestamp}`;
    
    return qrCodeId;
  }

  /**
   * Get QR code URL for a voucher
   * @param {string} qrCodeId - QR code identifier
   * @returns {string} - QR code URL
   */
  getQRCodeUrl(qrCodeId) {
    // Create a URL that can be used to verify the voucher
    // This URL will be encoded in the QR code
    const baseUrl = process.env.APP_URL || 'https://edubridge.example.com';
    return `${baseUrl}/verify-voucher/${qrCodeId}`;
  }
}

export default new VoucherService();