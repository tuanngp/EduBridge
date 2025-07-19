import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth.js';

const router = express.Router();

// Calculate distance between two coordinates using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate match score between device and school need
const calculateMatchScore = (device, need) => {
  let score = 0;
  
  // Match device type (most important factor)
  if (device.device_type === need.device_type) {
    score += 60;
  } else {
    // Check for similar device types (e.g., "Laptop" vs "Notebook")
    const deviceTypeLower = device.device_type.toLowerCase();
    const needTypeLower = need.device_type.toLowerCase();
    
    const laptopKeywords = ['laptop', 'notebook', 'macbook', 'thinkpad'];
    const desktopKeywords = ['desktop', 'pc', 'computer', 'tower'];
    const tabletKeywords = ['tablet', 'ipad', 'surface'];
    const phoneKeywords = ['phone', 'smartphone', 'mobile'];
    
    const isDeviceLaptop = laptopKeywords.some(keyword => deviceTypeLower.includes(keyword));
    const isNeedLaptop = laptopKeywords.some(keyword => needTypeLower.includes(keyword));
    
    const isDeviceDesktop = desktopKeywords.some(keyword => deviceTypeLower.includes(keyword));
    const isNeedDesktop = desktopKeywords.some(keyword => needTypeLower.includes(keyword));
    
    const isDeviceTablet = tabletKeywords.some(keyword => deviceTypeLower.includes(keyword));
    const isNeedTablet = tabletKeywords.some(keyword => needTypeLower.includes(keyword));
    
    const isDevicePhone = phoneKeywords.some(keyword => deviceTypeLower.includes(keyword));
    const isNeedPhone = phoneKeywords.some(keyword => needTypeLower.includes(keyword));
    
    if (
      (isDeviceLaptop && isNeedLaptop) ||
      (isDeviceDesktop && isNeedDesktop) ||
      (isDeviceTablet && isNeedTablet) ||
      (isDevicePhone && isNeedPhone)
    ) {
      score += 40;
    }
  }
  
  // Adjust score based on need priority
  switch (need.priority) {
    case 'urgent':
      score += 20;
      break;
    case 'high':
      score += 15;
      break;
    case 'medium':
      score += 10;
      break;
    case 'low':
      score += 5;
      break;
  }
  
  // Cap score at 100
  return Math.min(100, score);
};

/**
 * Get suggested schools for a device based on needs and location
 */
router.get('/device/:deviceId', authenticateToken, requireRole(['donor', 'admin']), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 5 } = req.query;
    
    // Verify device exists and belongs to the donor (if donor role)
    let deviceQuery = supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId);
    
    if (req.user.role === 'donor') {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      
      if (!donor) {
        return res.status(404).json({ error: 'Donor profile not found' });
      }
      
      deviceQuery = deviceQuery.eq('donor_id', donor.id);
    }
    
    const { data: device, error: deviceError } = await deviceQuery.single();
    
    if (deviceError || !device) {
      return res.status(404).json({ error: 'Device not found or access denied' });
    }
    
    // Get all verified schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select(`
        *,
        users!inner(is_verified)
      `)
      .eq('users.is_verified', true);
    
    if (schoolsError || !schools) {
      return res.status(500).json({ error: 'Failed to fetch schools' });
    }
    
    // Get all active needs from schools
    const { data: needs, error: needsError } = await supabase
      .from('needs')
      .select('*')
      .in('status', ['pending', 'approved']);
    
    if (needsError) {
      return res.status(500).json({ error: 'Failed to fetch school needs' });
    }
    
    // Calculate match scores and distances
    const schoolsWithScores = schools.map(school => {
      // Find needs for this school
      const schoolNeeds = needs?.filter(need => need.school_id === school.id) || [];
      
      // Calculate best match score from all needs
      let bestMatchScore = 0;
      let matchedNeed = null;
      
      for (const need of schoolNeeds) {
        const score = calculateMatchScore(device, need);
        if (score > bestMatchScore) {
          bestMatchScore = score;
          matchedNeed = need;
        }
      }
      
      // Calculate distance if location data is available
      let distance = null;
      if (
        device.location?.latitude && 
        device.location?.longitude && 
        school.location?.latitude && 
        school.location?.longitude
      ) {
        distance = calculateDistance(
          device.location.latitude,
          device.location.longitude,
          school.location.latitude,
          school.location.longitude
        );
      }
      
      return {
        ...school,
        distance,
        matchScore: bestMatchScore,
        matchedNeed: matchedNeed
      };
    });
    
    // Sort by match score (primary) and distance (secondary if available)
    const sortedSchools = schoolsWithScores.sort((a, b) => {
      // First sort by match score (higher is better)
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      // If match scores are equal and both have distance, sort by distance (lower is better)
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      // If one has distance and the other doesn't, prioritize the one with distance
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      
      // Otherwise, keep original order
      return 0;
    });
    
    // Return top N results
    const suggestedSchools = sortedSchools.slice(0, parseInt(limit));
    
    res.json({ suggestedSchools });
  } catch (error) {
    console.error('School suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;