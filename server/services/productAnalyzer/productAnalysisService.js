/**
 * Product Analysis Service
 * This service handles the analysis of product information from AI responses
 */

/**
 * Parses a JSON response from the AI
 * @param {string} response - The AI response to parse
 * @returns {Object} - The parsed JSON object
 */
export const parseJsonResponse = (response) => {
  try {
    // Try to extract JSON from the response if it's wrapped in markdown
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to parse as direct JSON
    return JSON.parse(response);
  } catch (error) {
    // If JSON parsing fails, create a structured response from text
    return parseTextResponse(response);
  }
};

/**
 * Parse text response when JSON parsing fails
 * @param {string} response - The AI text response
 * @returns {Object} - Structured analysis object
 */
const parseTextResponse = (response) => {
  // Extract product information using regex patterns
  const typeMatch = response.match(/(?:Product Type|Type|Item):\s*([^\n]+)/i);
  const brandMatch = response.match(/(?:Brand|Manufacturer):\s*([^\n]+)/i);
  const modelMatch = response.match(/(?:Model|Product Model):\s*([^\n]+)/i);
  const colorMatch = response.match(/(?:Color|Colour):\s*([^\n]+)/i);
  const conditionMatch = response.match(/(?:Condition|Overall Condition):\s*([^\n]+)/i);
  
  // Extract condition details
  const wearSigns = extractListItems(response, ['wear', 'signs of wear', 'wear signs']);
  const damages = extractListItems(response, ['damage', 'damages', 'defects']);
  const positiveAspects = extractListItems(response, ['positive', 'good', 'excellent']);
  
  // Extract explanation
  const explanationMatch = response.match(/(?:Explanation|Assessment|Analysis):\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i);
  
  return {
    productInfo: {
      type: typeMatch ? typeMatch[1].trim() : 'Unknown Product',
      brand: brandMatch ? brandMatch[1].trim() : null,
      model: modelMatch ? modelMatch[1].trim() : null,
      color: colorMatch ? colorMatch[1].trim() : null,
      materials: [],
      features: [],
      estimatedAge: null,
      certaintyScore: 75 // Default score for text parsing
    },
    conditionAssessment: {
      overallCondition: mapConditionText(conditionMatch ? conditionMatch[1].trim() : 'Unknown'),
      conditionDetails: {
        wearSigns: wearSigns,
        damages: damages,
        defects: [],
        positiveAspects: positiveAspects
      },
      conditionExplanation: explanationMatch ? explanationMatch[1].trim() : response.substring(0, 200) + '...',
      confidenceScore: 70 // Default confidence for text parsing
    },
    rawAnalysis: response
  };
};

/**
 * Extract list items from text based on keywords
 * @param {string} text - The text to search
 * @param {string[]} keywords - Keywords to look for
 * @returns {string[]} - Array of extracted items
 */
const extractListItems = (text, keywords) => {
  const items = [];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*([^\n]+(?:\n-[^\n]+)*)`, 'gi');
    const match = text.match(regex);
    
    if (match) {
      match.forEach(m => {
        const lines = m.split('\n');
        lines.forEach(line => {
          const cleaned = line.replace(/^[-*•]\s*/, '').replace(new RegExp(`^${keyword}[:\s]*`, 'i'), '').trim();
          if (cleaned && cleaned.length > 3) {
            items.push(cleaned);
          }
        });
      });
    }
  }
  
  return [...new Set(items)]; // Remove duplicates
};

/**
 * Map condition text to enum values
 * @param {string} conditionText - The condition text
 * @returns {string} - Mapped condition
 */
const mapConditionText = (conditionText) => {
  const lowerText = conditionText.toLowerCase();
  
  if (lowerText.includes('new') && lowerText.includes('like')) return 'Like New';
  if (lowerText.includes('new')) return 'New';
  if (lowerText.includes('excellent') || lowerText.includes('perfect')) return 'Like New';
  if (lowerText.includes('good') || lowerText.includes('fine')) return 'Good';
  if (lowerText.includes('fair') || lowerText.includes('okay') || lowerText.includes('ok')) return 'Fair';
  if (lowerText.includes('poor') || lowerText.includes('bad') || lowerText.includes('damaged')) return 'Poor';
  
  return 'Unknown';
};

/**
 * Analyzes a product based on the AI response
 * @param {string} aiResponse - The raw AI response
 * @returns {Promise<Object>} - The product analysis result
 */
export const analyzeProduct = async (aiResponse) => {
  try {
    // First try to parse as JSON
    const parsedData = parseJsonResponse(aiResponse);
    
    // Validate and structure the response
    const productInfo = {
      type: parsedData.productInfo?.type || parsedData.product?.type || 'Unknown Product',
      brand: parsedData.productInfo?.brand || parsedData.product?.brand || null,
      model: parsedData.productInfo?.model || parsedData.product?.model || null,
      color: parsedData.productInfo?.color || parsedData.product?.color || null,
      materials: parsedData.productInfo?.materials || parsedData.product?.materials || [],
      dimensions: parsedData.productInfo?.dimensions || parsedData.product?.dimensions || null,
      features: parsedData.productInfo?.features || parsedData.product?.features || [],
      estimatedAge: parsedData.productInfo?.estimatedAge || parsedData.product?.estimatedAge || null,
      certaintyScore: parsedData.productInfo?.certaintyScore || parsedData.product?.certaintyScore || calculateCertaintyScore(parsedData)
    };
    
    const conditionAssessment = {
      overallCondition: parsedData.conditionAssessment?.overallCondition || 
                       parsedData.condition?.overall || 
                       mapConditionText(parsedData.condition || 'Unknown'),
      conditionDetails: {
        wearSigns: parsedData.conditionAssessment?.conditionDetails?.wearSigns || 
                   parsedData.condition?.wearSigns || [],
        damages: parsedData.conditionAssessment?.conditionDetails?.damages || 
                 parsedData.condition?.damages || [],
        defects: parsedData.conditionAssessment?.conditionDetails?.defects || 
                 parsedData.condition?.defects || [],
        positiveAspects: parsedData.conditionAssessment?.conditionDetails?.positiveAspects || 
                        parsedData.condition?.positiveAspects || []
      },
      conditionExplanation: parsedData.conditionAssessment?.conditionExplanation || 
                           parsedData.condition?.explanation || 
                           parsedData.explanation || 
                           'Product condition analysis completed.',
      confidenceScore: parsedData.conditionAssessment?.confidenceScore || 
                      parsedData.condition?.confidence || 
                      calculateConfidenceScore(parsedData)
    };
    
    return {
      productInfo,
      conditionAssessment,
      rawAnalysis: aiResponse
    };
  } catch (error) {
    console.error('Error analyzing product:', error);
    
    // Fallback: return basic analysis
    return {
      productInfo: {
        type: 'Unknown Product',
        brand: null,
        model: null,
        color: null,
        materials: [],
        dimensions: null,
        features: [],
        estimatedAge: null,
        certaintyScore: 50
      },
      conditionAssessment: {
        overallCondition: 'Unknown',
        conditionDetails: {
          wearSigns: [],
          damages: [],
          defects: [],
          positiveAspects: []
        },
        conditionExplanation: 'Unable to analyze product condition from the provided response.',
        confidenceScore: 30
      },
      rawAnalysis: aiResponse
    };
  }
};

/**
 * Calculate certainty score based on available data
 * @param {Object} data - The parsed data
 * @returns {number} - Certainty score (0-100)
 */
const calculateCertaintyScore = (data) => {
  let score = 50; // Base score
  
  if (data.productInfo?.type || data.product?.type) score += 20;
  if (data.productInfo?.brand || data.product?.brand) score += 15;
  if (data.productInfo?.model || data.product?.model) score += 10;
  if (data.productInfo?.color || data.product?.color) score += 5;
  
  return Math.min(score, 100);
};

/**
 * Calculates a confidence score for the condition assessment
 * @param {Object} assessment - The condition assessment data
 * @returns {number} - The confidence score (0-100)
 */
export const calculateConfidenceScore = (assessment) => {
  let score = 60; // Base confidence
  
  // Increase confidence based on available details
  if (assessment.conditionAssessment?.conditionDetails?.wearSigns?.length > 0) score += 10;
  if (assessment.conditionAssessment?.conditionDetails?.damages?.length > 0) score += 10;
  if (assessment.conditionAssessment?.conditionDetails?.positiveAspects?.length > 0) score += 10;
  if (assessment.conditionAssessment?.conditionExplanation?.length > 50) score += 10;
  
  return Math.min(score, 100);
};