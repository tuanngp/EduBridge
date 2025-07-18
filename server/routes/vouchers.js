import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import voucherService from '../services/voucherService.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Create a voucher for a transfer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { transfer_id } = req.body;

    if (!transfer_id) {
      return res.status(400).json({ error: 'Transfer ID is required' });
    }

    // Check if user has permission to create voucher for this transfer
    let hasPermission = false;
    
    if (req.user.role === 'admin') {
      hasPermission = true;
    } else if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (donor) {
        const { data: transfer } = await supabase
          .from('transfers')
          .select('donor_id')
          .eq('id', transfer_id)
          .single();

        hasPermission = transfer && transfer.donor_id === donor.id;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to create voucher for this transfer' });
    }

    // Check if voucher already exists
    const { data: existingVoucher } = await supabase
      .from('transfer_vouchers')
      .select('id')
      .eq('transfer_id', transfer_id)
      .single();

    if (existingVoucher) {
      return res.status(400).json({ error: 'Voucher already exists for this transfer' });
    }

    const voucher = await voucherService.createVoucher(transfer_id);
    
    // Generate QR code URL
    const qrCodeUrl = voucherService.getQRCodeUrl(voucher.qr_code);
    
    res.status(201).json({ 
      voucher,
      qr_code_url: qrCodeUrl
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
});

// Get voucher by transfer ID
router.get('/transfer/:transferId', authenticateToken, async (req, res) => {
  try {
    const { transferId } = req.params;
    
    // Check if user has permission to view this voucher
    let hasPermission = false;
    
    if (req.user.role === 'admin') {
      hasPermission = true;
    } else {
      const { data: transfer } = await supabase
        .from('transfers')
        .select(`
          donor_id,
          school_id,
          donors(user_id),
          schools(user_id)
        `)
        .eq('id', transferId)
        .single();

      if (transfer) {
        if (req.user.role === 'donor' && transfer.donors.user_id === req.user.id) {
          hasPermission = true;
        } else if (req.user.role === 'school' && transfer.schools.user_id === req.user.id) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to view this voucher' });
    }

    const voucher = await voucherService.getVoucherByTransferId(transferId);
    
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    
    // Generate QR code URL
    const qrCodeUrl = voucherService.getQRCodeUrl(voucher.qr_code);
    
    res.json({ 
      voucher,
      qr_code_url: qrCodeUrl
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({ error: 'Failed to get voucher' });
  }
});

// Verify voucher by QR code
router.get('/verify/:qrCode', authenticateToken, async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const voucher = await voucherService.getVoucherByQRCode(qrCode);
    
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    
    // Check if voucher is expired
    if (voucher.status === 'expired' || new Date(voucher.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }
    
    // Check if voucher is already used
    if (voucher.status === 'used') {
      return res.status(400).json({ error: 'Voucher has already been used' });
    }
    
    res.json({ 
      voucher,
      is_valid: true
    });
  } catch (error) {
    console.error('Verify voucher error:', error);
    res.status(500).json({ error: 'Failed to verify voucher' });
  }
});

// Mark voucher as used
router.put('/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update this voucher
    let hasPermission = false;
    
    if (req.user.role === 'admin') {
      hasPermission = true;
    } else {
      const { data: voucher } = await supabase
        .from('transfer_vouchers')
        .select(`
          transfers(
            school_id,
            schools(user_id)
          )
        `)
        .eq('id', id)
        .single();

      // Only school or admin can mark voucher as used
      if (voucher && req.user.role === 'school' && 
          voucher.transfers.schools.user_id === req.user.id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to update this voucher' });
    }
    
    const updatedVoucher = await voucherService.updateVoucherStatus(id, 'used');
    
    res.json({ voucher: updatedVoucher });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ error: 'Failed to update voucher' });
  }
});

export default router;