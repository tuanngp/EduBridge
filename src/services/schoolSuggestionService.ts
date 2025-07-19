import apiService from './api';

export interface School {
  id: string;
  school_name: string;
  address: string;
  phone: string;
  student_count: number;
  contact_person: string;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
  distance?: number;
  matchScore?: number;
}

export interface DeviceInfo {
  id: string;
  device_type: string;
  condition: string;
  specifications?: Record<string, string>;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
}

export interface SchoolNeed {
  id: string;
  school_id: string;
  device_type: string;
  quantity: number;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

/**
 * Calculate match score between device and school need
 * @param device Device information
 * @param need School need information
 * @returns Match score between 0-100
 */
const calculateMatchScore = (device: DeviceInfo, need: SchoolNeed): number => {
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
 * @param deviceId Device ID
 * @param limit Maximum number of suggestions to return
 * @returns Array of suggested schools with match scores
 */
export const getSuggestedSchools = async (deviceId: string, limit = 5): Promise<School[]> => {
  try {
    const response = await apiService.getSchoolSuggestions(deviceId, limit);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data?.suggestedSchools || [];
  } catch (error) {
    console.error('Error getting suggested schools:', error);
    throw error;
  }
};