import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';

const router = express.Router();

// Create or update school profile
router.post('/profile', authenticateToken, requireRole(['school']), async (req, res) => {
  try {
    const { school_name, address, phone, student_count, contact_person, verification_documents } = req.body;

    if (!school_name || !address || !phone || !contact_person) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let school;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('schools')
        .update({
          school_name,
          address,
          phone,
          student_count,
          contact_person,
          verification_documents,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      school = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('schools')
        .insert([{
          id: uuidv4(),
          user_id: req.user.id,
          school_name,
          address,
          phone,
          student_count,
          contact_person,
          verification_documents,
          is_verified: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create profile' });
      }
      school = data;
    }

    res.json({ school });
  } catch (error) {
    console.error('School profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get school profile
router.get('/profile', authenticateToken, requireRole(['school']), async (req, res) => {
  try {
    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({ school: school || null });
  } catch (error) {
    console.error('Get school profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create device need/request
router.post('/needs', authenticateToken, requireRole(['school']), requireVerified, async (req, res) => {
  try {
    const { device_type, quantity, description, priority, specifications, min_condition } = req.body;

    if (!device_type || !quantity || !description) {
      return res.status(400).json({ error: 'Device type, quantity, and description are required' });
    }

    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'School profile not found' });
    }

    // Create the need
    const { data: need, error } = await supabase
      .from('needs')
      .insert([{
        id: uuidv4(),
        school_id: school.id,
        device_type,
        quantity,
        description,
        specifications: specifications || {},
        min_condition: min_condition || null,
        priority: priority || 'medium',
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create need' });
    }

    // Find matching devices for the new need
    // Import the service dynamically to avoid circular dependencies
    const { findMatchingDevices } = await import('../services/deviceSuggestionService.js');
    const matchingDevices = await findMatchingDevices(need, 5);

    res.status(201).json({ 
      need,
      matchingDevices
    });
  } catch (error) {
    console.error('Create need error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get school's needs
router.get('/needs', authenticateToken, requireRole(['school']), async (req, res) => {
  try {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'School profile not found' });
    }

    const { data: needs, error } = await supabase
      .from('needs')
      .select('*')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch needs' });
    }

    res.json({ needs });
  } catch (error) {
    console.error('Get needs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available devices
router.get('/available-devices', authenticateToken, requireRole(['school']), requireVerified, async (req, res) => {
  try {
    const { device_type, condition } = req.query;

    let query = supabase
      .from('devices')
      .select(`
        *,
        donors!inner(organization, phone),
        users!donors.user_id!inner(name, email)
      `)
      .eq('status', 'approved')
      .eq('users.is_verified', true);

    if (device_type) {
      query = query.eq('device_type', device_type);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    const { data: devices, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }

    res.json({ devices });
  } catch (error) {
    console.error('Get available devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get school's transfers
router.get('/transfers', authenticateToken, requireRole(['school']), async (req, res) => {
  try {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!school) {
      return res.status(404).json({ error: 'School profile not found' });
    }

    const { data: transfers, error } = await supabase
      .from('transfers')
      .select(`
        *,
        devices(*),
        donors(organization, phone)
      `)
      .eq('school_id', school.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch transfers' });
    }

    res.json({ transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;