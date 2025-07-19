import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import deviceReceiptRoutes from '../routes/deviceReceipt.js';

// Mock dependencies
jest.mock('../config/supabase.js', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn()
}));

jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'school' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  requireVerified: (req, res, next) => next()
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/device-receipts', deviceReceiptRoutes);

describe('Device Receipt API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /:transferId', () => {
    it('should return 400 if confirmation images are missing', async () => {
      const response = await request(app)
        .post('/api/device-receipts/test-transfer-id')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Hình ảnh xác nhận là bắt buộc');
    });

    it('should return 400 if confirmation images are empty array', async () => {
      const response = await request(app)
        .post('/api/device-receipts/test-transfer-id')
        .send({ confirmationImages: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Hình ảnh xác nhận là bắt buộc');
    });

    it('should return 400 if transfer is not in delivered status', async () => {
      // Mock supabase responses
      const mockSchool = { id: 'test-school-id' };
      const mockTransfer = { 
        id: 'test-transfer-id',
        status: 'pending',
        device_id: 'test-device-id'
      };

      const supabase = require('../config/supabase.js');
      supabase.from.mockImplementation((table) => {
        if (table === 'schools') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockSchool, error: null })
              })
            })
          };
        } else if (table === 'transfers') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => ({ data: mockTransfer, error: null })
                })
              })
            })
          };
        }
        return supabase;
      });

      const response = await request(app)
        .post('/api/device-receipts/test-transfer-id')
        .send({ confirmationImages: ['image1.jpg'] });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Không thể xác nhận nhận thiết bị');
    });

    it('should successfully confirm device receipt', async () => {
      // Mock supabase responses
      const mockSchool = { id: 'test-school-id' };
      const mockTransfer = { 
        id: 'test-transfer-id',
        status: 'delivered',
        device_id: 'test-device-id'
      };
      const mockUpdatedTransfer = { 
        ...mockTransfer,
        status: 'received'
      };
      const mockReceipt = { 
        id: 'test-receipt-id',
        transfer_id: 'test-transfer-id'
      };

      const supabase = require('../config/supabase.js');
      supabase.from.mockImplementation((table) => {
        if (table === 'schools') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockSchool, error: null })
              })
            })
          };
        } else if (table === 'transfers') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => ({ data: mockTransfer, error: null })
                })
              })
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => ({ data: mockUpdatedTransfer, error: null })
                })
              })
            })
          };
        } else if (table === 'devices') {
          return {
            update: () => ({
              eq: () => ({ data: null, error: null })
            })
          };
        } else if (table === 'device_receipts') {
          return {
            insert: () => ({
              select: () => ({
                single: () => ({ data: mockReceipt, error: null })
              })
            })
          };
        }
        return supabase;
      });

      const response = await request(app)
        .post('/api/device-receipts/test-transfer-id')
        .send({ 
          confirmationImages: ['image1.jpg', 'image2.jpg'],
          notes: 'Test notes'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Xác nhận nhận thiết bị thành công');
      expect(response.body.transfer).toEqual(mockUpdatedTransfer);
      expect(response.body.receipt).toEqual(mockReceipt);
    });
  });

  describe('GET /:transferId', () => {
    it('should return receipt details', async () => {
      // Mock supabase response
      const mockReceipt = { 
        id: 'test-receipt-id',
        transfer_id: 'test-transfer-id',
        confirmation_images: ['image1.jpg', 'image2.jpg']
      };

      const supabase = require('../config/supabase.js');
      supabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: mockReceipt, error: null })
          })
        })
      }));

      const response = await request(app)
        .get('/api/device-receipts/test-transfer-id');

      expect(response.status).toBe(200);
      expect(response.body.receipt).toEqual(mockReceipt);
    });

    it('should return 404 if receipt not found', async () => {
      // Mock supabase response
      const supabase = require('../config/supabase.js');
      supabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: { message: 'Not found' } })
          })
        })
      }));

      const response = await request(app)
        .get('/api/device-receipts/test-transfer-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Không tìm thấy thông tin xác nhận nhận thiết bị');
    });
  });
});