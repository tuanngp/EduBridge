const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole, requireVerified } = require('../middleware/auth');

const router = express.Router();

// Create transfer request (donor initiates)
router.post('/', authenticateToken, requireRole(['donor']), requireVerified, async (req, res) => {
  try {
    const { device_id, school_id, message } = req.body;

    if (!device_id || !school_id) {
      return res.status(400).json({ error: 'Device ID and School ID are required' });
    }

    const { data: donor } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    // Verify device belongs to donor and is approved
    const { data: device } = await supabase
      .from('devices')
      .select('*')
      .eq('id', device_id)
      .eq('donor_id', donor.id)
      .eq('status', 'approved')
      .single();

    if (!device) {
      return res.status(404).json({ error: 'Device not found or not approved' });
    }

    // Verify school exists and is verified
    const { data: school } = await supabase
      .from('schools')
      .select(`
        *,
        users!inner(is_verified)
      `)
      .eq('id', school_id)
      .eq('users.is_verified', true)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'School not found or not verified' });
    }

    // Check if transfer already exists for this device
    const { data: existingTransfer } = await supabase
      .from('transfers')
      .select('id')
      .eq('device_id', device_id)
      .in('status', ['pending', 'approved', 'in_transit'])
      .single();

    if (existingTransfer) {
      return res.status(400).json({ error: 'Transfer already exists for this device' });
    }

    // Create transfer
    const { data: transfer, error } = await supabase
      .from('transfers')
      .insert([{
        id: uuidv4(),
        device_id,
        donor_id: donor.id,
        school_id,
        message: message || '',
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        devices(*),
        donors(organization, phone),
        schools(school_name, contact_person, phone)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create transfer' });
    }

    // Update device status to matched
    await supabase
      .from('devices')
      .update({ status: 'matched' })
      .eq('id', device_id);

    res.status(201).json({ transfer });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transfers for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!donor) {
        return res.status(404).json({ error: 'Donor profile not found' });
      }

      query = supabase
        .from('transfers')
        .select(`
          *,
          devices(*),
          schools(school_name, contact_person, phone, address)
        `)
        .eq('donor_id', donor.id);
    } else if (req.user.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!school) {
        return res.status(404).json({ error: 'School profile not found' });
      }

      query = supabase
        .from('transfers')
        .select(`
          *,
          devices(*),
          donors(organization, phone)
        `)
        .eq('school_id', school.id);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: transfers, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch transfers' });
    }

    res.json({ transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transfer status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, received_images } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'in_transit', 'delivered', 'received'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get transfer with related data
    const { data: transfer, error: fetchError } = await supabase
      .from('transfers')
      .select(`
        *,
        devices(*),
        donors(*),
        schools(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Check permissions based on role and status
    let canUpdate = false;
    
    if (req.user.role === 'admin') {
      canUpdate = true;
    } else if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (donor && transfer.donor_id === donor.id) {
        // Donor can update to in_transit or delivered
        canUpdate = ['in_transit', 'delivered'].includes(status);
      }
    } else if (req.user.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (school && transfer.school_id === school.id) {
        // School can update to received
        canUpdate = status === 'received';
      }
    }

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this transfer status' });
    }

    // Update transfer
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) updateData.notes = notes;
    if (received_images) updateData.received_images = received_images;

    const { data: updatedTransfer, error: updateError } = await supabase
      .from('transfers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        devices(*),
        donors(organization, phone),
        schools(school_name, contact_person, phone)
      `)
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update transfer' });
    }

    // Update device status based on transfer status
    let deviceStatus;
    switch (status) {
      case 'approved':
        deviceStatus = 'matched';
        break;
      case 'rejected':
        deviceStatus = 'approved';
        break;
      case 'received':
        deviceStatus = 'completed';
        break;
      default:
        deviceStatus = 'matched';
    }

    await supabase
      .from('devices')
      .update({ status: deviceStatus })
      .eq('id', transfer.device_id);

    res.json({ transfer: updatedTransfer });
  } catch (error) {
    console.error('Update transfer status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transfer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transfer, error } = await supabase
      .from('transfers')
      .select(`
        *,
        devices(*),
        donors(organization, phone),
        schools(school_name, contact_person, phone, address)
      `)
      .eq('id', id)
      .single();

    if (error || !transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Check permissions
    let hasAccess = false;

    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      hasAccess = donor && transfer.donor_id === donor.id;
    } else if (req.user.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      hasAccess = school && transfer.school_id === school.id;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ transfer });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;