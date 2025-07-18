/**
 * Device Suggestion Service
 * 
 * This service analyzes device descriptions and provides suggestions for device information
 * based on common patterns and keywords.
 */

// Device type keywords for pattern matching
const deviceTypeKeywords: Record<string, string[]> = {
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
const conditionKeywords: Record<string, string[]> = {
  'new': ['new', 'brand new', 'unopened', 'sealed', 'in box'],
  'used-good': ['good condition', 'lightly used', 'barely used', 'excellent', 'great condition'],
  'used-fair': ['fair condition', 'used', 'worn', 'functional', 'working', 'some wear'],
};

// Common specifications patterns
const specPatterns = [
  // RAM patterns
  { regex: /(\d+)\s*(GB|G|GIG|GIGABYTE)s?\s*(RAM|MEMORY)/i, key: 'RAM', format: (match: RegExpMatchArray) => `${match[1]} GB RAM` },
  
  // Storage patterns
  { regex: /(\d+)\s*(GB|G|TB|T)\s*(SSD|HDD|STORAGE|DRIVE)/i, key: 'Storage', format: (match: RegExpMatchArray) => `${match[1]} ${match[2]} ${match[3]}` },
  
  // Processor patterns
  { regex: /(i\d|ryzen|core i\d|intel|amd|snapdragon|a\d+)\s*(\d+)?/i, key: 'Processor', format: (match: RegExpMatchArray) => match[0].trim() },
  
  // Screen size patterns
  { regex: /(\d+\.?\d*)[\s-]*(inch|in|"|inches)/i, key: 'Screen Size', format: (match: RegExpMatchArray) => `${match[1]} inch` },
  
  // Year/model patterns
  { regex: /(20\d\d|19\d\d)\s*(model|version)?/i, key: 'Year', format: (match: RegExpMatchArray) => match[1] },
  
  // OS patterns
  { regex: /(windows|mac os|macos|ios|android|chrome os|linux)\s*([\d\.]+)?/i, key: 'Operating System', format: (match: RegExpMatchArray) => match[0].trim() },
];

export interface DeviceSuggestion {
  deviceType?: string;
  condition?: string;
  specifications?: Record<string, string>;
  confidence: number; // 0-100 confidence score
}

/**
 * Analyzes a device description and suggests device information
 * @param description The device description to analyze
 * @returns Suggested device information
 */
export const analyzeDeviceDescription = (description: string): DeviceSuggestion => {
  const lowerDesc = description.toLowerCase();
  const suggestion: DeviceSuggestion = {
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
  const specs: Record<string, string> = {};
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

export default {
  analyzeDeviceDescription
};