import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Device type keywords for pattern matching
const deviceTypeKeywords = {
  'Laptop': ['laptop', 'notebook', 'macbook', 'thinkpad', 'dell xps', 'hp pavilion', 'lenovo', 'asus', 'acer'],
  'Desktop Computer': ['desktop', 'pc', 'computer', 'tower', 'workstation'],
  'Tablet': ['tablet', 'ipad', 'galaxy tab', 'surface'],
  'Smartphone': ['phone', 'smartphone', 'iphone', 'android', 'galaxy', 'pixel'],
  'Monitor': ['monitor', 'display', 'screen', 'lcd', 'led display'],
  'Keyboard': ['keyboard', 'mechanical keyboard', 'wireless keyboard'],
  'Mouse': ['mouse', 'wireless mouse', 'trackpad'],
  'Printer': ['printer', 'all-in-one', 'laser printer', 'inkjet'],
  'Projector': ['projector', 'beamer'],
  'Webcam': ['webcam', 'camera', 'video camera'],
};

// Condition keywords for pattern matching
const conditionKeywords = {
  'new': ['new', 'brand new', 'unopened', 'sealed', 'in box'],
  'used-good': ['good condition', 'lightly used', 'barely used', 'excellent', 'great condition'],
  'used-fair': ['fair condition', 'used', 'worn', 'functional', 'working', 'some wear'],
};

// Common specifications patterns
const specPatterns = [
  // RAM patterns
  { regex: /(\d+)\s*(GB|G|GIG|GIGABYTE)s?\s*(RAM|MEMORY)/i, key: 'RAM', format: (match) => `${match[1]} GB RAM` },
  
  // Storage patterns
  { regex: /(\d+)\s*(GB|G|TB|T)\s*(SSD|HDD|STORAGE|DRIVE)/i, key: 'Storage', format: (match) => `${match[1]} ${match[2]} ${match[3]}` },
  
  // Processor patterns
  { regex: /(i\d|ryzen|core i\d|intel|amd|snapdragon|a\d+)\s*(\d+)?/i, key: 'Processor', format: (match) => match[0].trim() },
  
  // Screen size patterns
  { regex: /(\d+\.?\d*)[\s-]*(inch|in|"|inches)/i, key: 'Screen Size', format: (match) => `${match[1]} inch` },
  
  // Year/model patterns
  { regex: /(20\d\d|19\d\d)\s*(model|version)?/i, key: 'Year', format: (match) => match[1] },
  
  // OS patterns
  { regex: /(windows|mac os|macos|ios|android|chrome os|linux)\s*([\d\.]+)?/i, key: 'Operating System', format: (match) => match[0].trim() },
];

/**
 * Analyzes a device description and suggests device information
 */
const analyzeDeviceDescription = (description) => {
  const lowerDesc = description.toLowerCase();
  const suggestion = {
    specifications: {},
    confidence: 0
  };
  
  // Detect device type
  let highestTypeScore = 0;
  let detectedType = '';
  
  Object.entries(deviceTypeKeywords).forEach(([type, keywords]) => {
    const matches = keywords.filter(keyword => lowerDesc.includes(keyword.toLowerCase()));
    const score = matches.length;
    
    if (score > highestTypeScore) {
      highestTypeScore = score;
      detectedType = type;
    }
  });
  
  if (detectedType) {
    suggestion.deviceType = detectedType;
    suggestion.confidence += 30; // Base confidence for device type detection
  }
  
  // Detect condition
  let highestConditionScore = 0;
  let detectedCondition = '';
  
  Object.entries(conditionKeywords).forEach(([condition, keywords]) => {
    const matches = keywords.filter(keyword => lowerDesc.includes(keyword.toLowerCase()));
    const score = matches.length;
    
    if (score > highestConditionScore) {
      highestConditionScore = score;
      detectedCondition = condition;
    }
  });
  
  if (detectedCondition) {
    suggestion.condition = detectedCondition;
    suggestion.confidence += 20; // Base confidence for condition detection
  }
  
  // Extract specifications
  const specs = {};
  let specCount = 0;
  
  specPatterns.forEach(pattern => {
    const match = description.match(pattern.regex);
    if (match) {
      specs[pattern.key] = pattern.format(match);
      specCount++;
    }
  });
  
  if (specCount > 0) {
    suggestion.specifications = specs;
    suggestion.confidence += Math.min(50, specCount * 10); // Up to 50% additional confidence based on specs
  }
  
  // Normalize confidence to 0-100 range
  suggestion.confidence = Math.min(100, suggestion.confidence);
  
  return suggestion;
};

// Get device suggestions based on description
router.post('/device', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const suggestion = analyzeDeviceDescription(description);
    
    res.json({ suggestion });
  } catch (error) {
    console.error('Device suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;