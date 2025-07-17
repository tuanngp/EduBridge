import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';

const router = express.Router();

// Create or update donor profile
router.post('/profile', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const { organization, phone, address } = req.body;

    if (!organization || !phone) {
      return res.status(400).json({ error: 'Organization and phone are required' });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let donor;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('donors')
        .update({
          organization,
          phone,
          address,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      donor = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('donors')
        .insert([{
          id: uuidv4(),
          user_id: req.user.id,
          organization,
          phone,
          address,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create profile' });
      }
      donor = data;
    }

    res.json({ donor });
  } catch (error) {
    console.error('Donor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donor profile
router.get('/profile', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({ donor: donor || null });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donor's devices
router.get('/devices', authenticateToken, requireRole(['donor']), async (req, res) => {
  try {
    const { data: donor } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .eq('donor_id', donor.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }

    res.json({ devices });
  } catch (error) {
    console.error('Get donor devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available schools for matching
router.get('/schools', authenticateToken, requireRole(['donor']), requireVerified, async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select(`
        *,
        users!inner(name, email, is_verified)
      `)
      .eq('users.is_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch schools' });
    }

    res.json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;