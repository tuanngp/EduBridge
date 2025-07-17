import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';

const router = express.Router();

// Create device donation
router.post('/', authenticateToken, requireRole(['donor']), requireVerified, async (req, res) => {
  try {
    const { name, description, device_type, condition, quantity, images } = req.body;

    if (!name || !description || !device_type || !condition || !quantity) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (!['new', 'used-good', 'used-fair'].includes(condition)) {
      return res.status(400).json({ error: 'Invalid condition value' });
    }

    const { data: donor } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const { data: device, error } = await supabase
      .from('devices')
      .insert([{
        id: uuidv4(),
        donor_id: donor.id,
        name,
        description,
        device_type,
        condition,
        quantity: parseInt(quantity),
        images: images || [],
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create device' });
    }

    res.status(201).json({ device });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: device, error } = await supabase
      .from('devices')
      .select(`
        *,
        donors(organization, phone),
        users!donors.user_id(name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check permissions
    if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (device.donor_id !== donor?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ device });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device
router.put('/:id', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, device_type, condition, quantity, images } = req.body;

    const { data: donor } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    // Check if device belongs to donor
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .eq('donor_id', donor.id)
      .single();

    if (!existingDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Only allow updates if device is pending or approved
    if (!['pending', 'approved'].includes(existingDevice.status)) {
      return res.status(400).json({ error: 'Cannot update device in current status' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (device_type) updateData.device_type = device_type;
    if (condition) updateData.condition = condition;
    if (quantity) updateData.quantity = parseInt(quantity);
    if (images) updateData.images = images;

    const { data: device, error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update device' });
    }

    res.json({ device });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete device
router.delete('/:id', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: donor } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    // Check if device belongs to donor and can be deleted
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .eq('donor_id', donor.id)
      .single();

    if (!existingDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Only allow deletion if device is pending or approved
    if (!['pending', 'approved'].includes(existingDevice.status)) {
      return res.status(400).json({ error: 'Cannot delete device in current status' });
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete device' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all approved devices (public for schools)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { device_type, condition, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('devices')
      .select(`
        *,
        donors(organization, phone),
        users!donors.user_id(name, email)
      `)
      .eq('status', 'approved')
      .eq('users.is_verified', true);

    if (device_type) {
      query = query.eq('device_type', device_type);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: devices, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }

    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;