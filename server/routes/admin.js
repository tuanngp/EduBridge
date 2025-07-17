import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get user counts
    const { data: users } = await supabase
      .from('users')
      .select('role');

    const userStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Get device counts
    const { data: devices } = await supabase
      .from('devices')
      .select('status');

    const deviceStats = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});

    // Get transfer counts
    const { data: transfers } = await supabase
      .from('transfers')
      .select('status');

    const transferStats = transfers.reduce((acc, transfer) => {
      acc[transfer.status] = (acc[transfer.status] || 0) + 1;
      return acc;
    }, {});

    // Get school verification counts
    const { data: schools } = await supabase
      .from('schools')
      .select('is_verified');

    const schoolStats = schools.reduce((acc, school) => {
      const key = school.is_verified ? 'verified' : 'pending';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      users: {
        total: users.length,
        ...userStats
      },
      devices: {
        total: devices.length,
        ...deviceStats
      },
      transfers: {
        total: transfers.length,
        ...transferStats
      },
      schools: {
        total: schools.length,
        ...schoolStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role, is_verified, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('users')
      .select('id, email, name, role, is_verified, created_at, updated_at');

    if (role) {
      query = query.eq('role', role);
    }

    if (is_verified !== undefined) {
      query = query.eq('is_verified', is_verified === 'true');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: users, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify/unverify user
router.put('/users/:id/verify', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    if (typeof is_verified !== 'boolean') {
      return res.status(400).json({ error: 'is_verified must be a boolean' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        is_verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, name, role, is_verified')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all devices
router.get('/devices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, device_type, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('devices')
      .select(`
        *,
        donors(organization, phone),
        users!donors.user_id(name, email)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (device_type) {
      query = query.eq('device_type', device_type);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: devices, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }

    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/reject device
router.put('/devices/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const { data: device, error } = await supabase
      .from('devices')
      .update({
        status,
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        donors(organization, phone),
        users!donors.user_id(name, email)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update device' });
    }

    res.json({ device });
  } catch (error) {
    console.error('Update device status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all schools
router.get('/schools', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { is_verified, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('schools')
      .select(`
        *,
        users!inner(name, email, is_verified)
      `);

    if (is_verified !== undefined) {
      query = query.eq('is_verified', is_verified === 'true');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: schools, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch schools' });
    }

    res.json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify/unverify school
router.put('/schools/:id/verify', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified, admin_notes } = req.body;

    if (typeof is_verified !== 'boolean') {
      return res.status(400).json({ error: 'is_verified must be a boolean' });
    }

    const { data: school, error } = await supabase
      .from('schools')
      .update({
        is_verified,
        admin_notes: admin_notes || null,
        verified_at: is_verified ? new Date().toISOString() : null,
        verified_by: is_verified ? req.user.id : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        users!inner(name, email)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update school' });
    }

    res.json({ school });
  } catch (error) {
    console.error('Verify school error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transfers
router.get('/transfers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('transfers')
      .select(`
        *,
        devices(name, device_type, condition),
        donors(organization, phone),
        schools(school_name, contact_person, phone)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
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

// Get all needs/requests
router.get('/needs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, device_type, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('needs')
      .select(`
        *,
        schools(school_name, contact_person, phone),
        users!schools.user_id(name, email)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (device_type) {
      query = query.eq('device_type', device_type);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: needs, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch needs' });
    }

    res.json({ needs });
  } catch (error) {
    console.error('Get needs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;