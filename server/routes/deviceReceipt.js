import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';

const router = express.Router();

// Confirm device receipt
router.post('/:transferId', authenticateToken, requireRole(['school']), requireVerified, async (req, res) => {
  try {
    const { transferId } = req.params;
    const { confirmationImages, notes } = req.body;

    if (!confirmationImages || !Array.isArray(confirmationImages) || confirmationImages.length === 0) {
      return res.status(400).json({ error: 'Hình ảnh xác nhận là bắt buộc' });
    }

    // Get school ID for the current user
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin trường học' });
    }

    // Get transfer details
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select(`
        *,
        devices(*)
      `)
      .eq('id', transferId)
      .eq('school_id', school.id)
      .single();

    if (transferError || !transfer) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin chuyển giao' });
    }

    // Check if transfer is in the correct status
    if (transfer.status !== 'delivered') {
      return res.status(400).json({
        error: 'Không thể xác nhận nhận thiết bị. Thiết bị phải ở trạng thái đã giao.',
        currentStatus: transfer.status
      });
    }

    // Update transfer status to received
    const { data: updatedTransfer, error: updateError } = await supabase
      .from('transfers')
      .update({
        status: 'received',
        received_images: confirmationImages,
        notes: notes || transfer.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select(`
        *,
        devices(*),
        donors(organization, phone),
        schools(school_name, contact_person, phone)
      `)
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Không thể cập nhật trạng thái chuyển giao' });
    }

    // Update device status to completed
    await supabase
      .from('devices')
      .update({ status: 'completed' })
      .eq('id', transfer.device_id);

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('device_receipts')
      .insert([{
        id: uuidv4(),
        transfer_id: transferId,
        device_id: transfer.device_id,
        school_id: school.id,
        confirmation_images: confirmationImages,
        notes: notes || '',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (receiptError) {
      console.error('Failed to create receipt record:', receiptError);
      // Continue even if receipt record creation fails
    }

    res.json({
      message: 'Xác nhận nhận thiết bị thành công',
      transfer: updatedTransfer,
      receipt
    });
  } catch (error) {
    console.error('Device receipt confirmation error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Get receipt details
router.get('/:transferId', authenticateToken, async (req, res) => {
  try {
    const { transferId } = req.params;

    // Check permissions
    let query = supabase
      .from('device_receipts')
      .select(`
        *,
        transfers(*),
        devices(*)
      `)
      .eq('transfer_id', transferId);

    if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!donor) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin người quyên góp' });
      }

      query = query.eq('transfers.donor_id', donor.id);
    } else if (req.user.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!school) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin trường học' });
      }

      query = query.eq('school_id', school.id);
    }

    const { data: receipt, error } = await query.single();

    if (error || !receipt) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin xác nhận nhận thiết bị' });
    }

    res.json({ receipt });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;