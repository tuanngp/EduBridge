import { describe, it, expect, vi, beforeEach } from 'vitest';
import voucherService from '../services/voucherService.js';
import supabase from '../config/supabase.js';

// Mock supabase
vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }
}));

describe('VoucherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVoucher', () => {
    it('should create a new voucher for a valid transfer', async () => {
      // Mock transfer data
      const mockTransfer = {
        id: 'transfer-123',
        device_id: 'device-123',
        donor_id: 'donor-123',
        school_id: 'school-123',
        status: 'approved'
      };

      // Mock voucher data
      const mockVoucher = {
        id: 'voucher-123',
        transfer_id: 'transfer-123',
        qr_code: 'qr-code-123',
        status: 'active',
        expiry_date: new Date().toISOString()
      };

      // Mock supabase responses
      supabase.single
        .mockResolvedValueOnce({ data: mockTransfer, error: null })
        .mockResolvedValueOnce({ data: mockVoucher, error: null });

      // Generate QR code ID spy
      const generateQRCodeIdSpy = vi.spyOn(voucherService, 'generateQRCodeId');
      generateQRCodeIdSpy.mockReturnValue('qr-code-123');

      // Call the method
      const result = await voucherService.createVoucher('transfer-123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('transfers');
      expect(supabase.select).toHaveBeenCalledWith(`
          *,
          devices(*),
          donors(*),
          schools(*)
        `);
      expect(supabase.eq).toHaveBeenCalledWith('id', 'transfer-123');
      expect(supabase.from).toHaveBeenCalledWith('transfer_vouchers');
      expect(supabase.insert).toHaveBeenCalled();
      expect(generateQRCodeIdSpy).toHaveBeenCalled();
      expect(result).toEqual(mockVoucher);
    });

    it('should throw an error if transfer is not found', async () => {
      // Mock supabase response for non-existent transfer
      supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      // Call the method and expect it to throw
      await expect(voucherService.createVoucher('non-existent-transfer'))
        .rejects
        .toThrow('Transfer not found');
    });

    it('should throw an error if voucher creation fails', async () => {
      // Mock transfer data
      const mockTransfer = {
        id: 'transfer-123',
        device_id: 'device-123',
        donor_id: 'donor-123',
        school_id: 'school-123',
        status: 'approved'
      };

      // Mock supabase responses
      supabase.single
        .mockResolvedValueOnce({ data: mockTransfer, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      // Call the method and expect it to throw
      await expect(voucherService.createVoucher('transfer-123'))
        .rejects
        .toThrow('Failed to create voucher: Database error');
    });
  });

  describe('getVoucherByTransferId', () => {
    it('should return voucher for a valid transfer ID', async () => {
      // Mock voucher data
      const mockVoucher = {
        id: 'voucher-123',
        transfer_id: 'transfer-123',
        qr_code: 'qr-code-123',
        status: 'active',
        expiry_date: new Date().toISOString(),
        transfers: {
          id: 'transfer-123',
          devices: { name: 'Laptop' },
          donors: { organization: 'Tech Corp' },
          schools: { school_name: 'ABC School' }
        }
      };

      // Mock supabase response
      supabase.single.mockResolvedValueOnce({ data: mockVoucher, error: null });

      // Call the method
      const result = await voucherService.getVoucherByTransferId('transfer-123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('transfer_vouchers');
      expect(supabase.select).toHaveBeenCalledWith(`
          *,
          transfers(
            *,
            devices(*),
            donors(*),
            schools(*)
          )
        `);
      expect(supabase.eq).toHaveBeenCalledWith('transfer_id', 'transfer-123');
      expect(result).toEqual(mockVoucher);
    });

    it('should throw an error if voucher retrieval fails', async () => {
      // Mock supabase response
      supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      // Call the method and expect it to throw
      await expect(voucherService.getVoucherByTransferId('transfer-123'))
        .rejects
        .toThrow('Failed to get voucher: Database error');
    });
  });

  describe('generateQRCodeId', () => {
    it('should generate a unique QR code ID', () => {
      // Mock the crypto.randomBytes function to return a predictable value
      const originalRandomBytes = crypto.randomBytes;
      crypto.randomBytes = vi.fn().mockReturnValue(Buffer.from('0123456789abcdef0123456789abcdef', 'hex'));
      
      const qrCodeId = voucherService.generateQRCodeId();
      
      // Restore the original function
      crypto.randomBytes = originalRandomBytes;
      
      // Check that it's a string
      expect(typeof qrCodeId).toBe('string');
      
      // Check that it contains a timestamp
      expect(qrCodeId).toContain('-');
    });
  });

  describe('getQRCodeUrl', () => {
    it('should return a valid URL for a QR code ID', () => {
      const qrCodeId = 'qr-code-123';
      const url = voucherService.getQRCodeUrl(qrCodeId);
      
      // Check that it's a string
      expect(typeof url).toBe('string');
      
      // Check that it contains the QR code ID
      expect(url).toContain(qrCodeId);
      
      // Check that it's a valid URL
      expect(url).toMatch(/^https?:\/\/.+\/verify-voucher\/.+$/);
    });
  });
});