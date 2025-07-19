import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Get device history
router.get('/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const { data, error } = await supabase
      .from('device_history')
      .select(`
        id,
        device_id,
        status,
        description,
        timestamp,
        performed_by,
        users:performed_by (id, name)
      `)
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching device history:', error);
      return res.status(500).json({ error: 'Failed to fetch device history' });
    }

    res.json({ history: data });
  } catch (error) {
    console.error('Device history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add device history entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { deviceId, status, description } = req.body;

    if (!deviceId || !status || !description) {
      return res.status(400).json({ error: 'Device ID, status, and description are required' });
    }

    const { data, error } = await supabase
      .from('device_history')
      .insert({
        device_id: deviceId,
        status,
        description,
        performed_by: req.user.id,
        timestamp: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error adding device history:', error);
      return res.status(500).json({ error: 'Failed to add device history' });
    }

    res.status(201).json({ history: data[0] });
  } catch (error) {
    console.error('Add device history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;