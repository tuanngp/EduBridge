import express from 'express';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';
import { findMatchingDevices, findDevicesForSchoolNeeds } from '../services/deviceSuggestionService.js';
import supabase from '../config/supabase.js';

const router = express.Router();

/**
 * Get device suggestions for a specific need
 * GET /api/device-suggestions/need/:needId
 */
router.get('/need/:needId', authenticateToken, requireRole(['school', 'admin']), async (req, res) => {
  try {
    const { needId } = req.params;
    const { limit = 10 } = req.query;
    
    // Verify need exists and belongs to the school (if school role)
    let needQuery = supabase
      .from('needs')
      .select('*')
      .eq('id', needId);
    
    if (req.user.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      
      if (!school) {
        return res.status(404).json({ error: 'School profile not found' });
      }
      
      needQuery = needQuery.eq('school_id', school.id);
    }
    
    const { data: need, error: needError } = await needQuery.single();
    
    if (needError || !need) {
      return res.status(404).json({ error: 'Need not found or access denied' });
    }
    
    // Find matching devices
    const matchingDevices = await findMatchingDevices(need, parseInt(limit));
    
    res.json({ 
      need,
      matchingDevices
    });
  } catch (error) {
    console.error('Device suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get device suggestions for all needs of a school
 * GET /api/device-suggestions/school
 */
router.get('/school', authenticateToken, requireRole(['school']), requireVerified, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get school ID
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    if (!school) {
      return res.status(404).json({ error: 'School profile not found' });
    }
    
    // Find matching devices for all school needs
    const result = await findDevicesForSchoolNeeds(school.id, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('School device suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get device suggestions when creating a new need
 * POST /api/device-suggestions/preview
 */
router.post('/preview', authenticateToken, requireRole(['school']), requireVerified, async (req, res) => {
  try {
    const { device_type, quantity, description, specifications, min_condition, priority } = req.body;
    
    if (!device_type) {
      return res.status(400).json({ error: 'Device type is required' });
    }
    
    // Create a temporary need object for matching
    const tempNeed = {
      device_type,
      quantity: quantity || 1,
      description: description || '',
      specifications: specifications || {},
      min_condition: min_condition || null,
      priority: priority || 'medium'
    };
    
    // Find matching devices
    const matchingDevices = await findMatchingDevices(tempNeed, 10);
    
    res.json({ matchingDevices });
  } catch (error) {
    console.error('Device suggestion preview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;