/**
 * OpenRouter Service
 * This service handles communication with the OpenRouter API
 */
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Available models for image analysis
const MODELS = {
  BASIC: 'mistralai/mistral-small-3.1-24b-instruct:free',
  STANDARD: 'mistralai/mistral-small-3.1-24b-instruct:free',
  DETAILED: 'mistralai/mistral-small-3.1-24b-instruct:free',
  // Alternative models that can be used as fallbacks
  FALLBACK_BASIC: 'mistralai/mistral-small-3.1-24b-instruct:free',
  FALLBACK_STANDARD: 'mistralai/mistral-small-3.1-24b-instruct:free',
  FALLBACK_DETAILED: 'mistralai/mistral-small-3.1-24b-instruct:free'
};

// Default model configurations
const MODEL_CONFIGS = {
  BASIC: {
    model: MODELS.BASIC,
    maxTokens: 2000,
    temperature: 0.5
  },
  STANDARD: {
    model: MODELS.STANDARD,
    maxTokens: 4000,
    temperature: 0.7
  },
  DETAILED: {
    model: MODELS.DETAILED,
    maxTokens: 6000,
    temperature: 0.8
  }
};

// Error codes
const ERROR_CODES = {
  AUTHENTICATION_ERROR: 'OPENROUTER_AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'OPENROUTER_RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE: 'OPENROUTER_SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR: 'OPENROUTER_TIMEOUT_ERROR',
  INVALID_RESPONSE: 'OPENROUTER_INVALID_RESPONSE',
  UNKNOWN_ERROR: 'OPENROUTER_UNKNOWN_ERROR'
};

/**
 * Analyzes an image using the OpenRouter API
 * @param {string} imageUrl - The URL of the image to analyze
 * @param {Object} options - Options for the analysis
 * @returns {Promise<Object>} - The OpenRouter API response
 */
export const analyzeImage = async (imageUrl, options = {}) => {
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  try {
    // Get model configuration based on options
    const modelConfig = getModelConfig(options);
    
    // Configure request options
    const model = options.model || modelConfig.model;
    const maxTokens = options.maxTokens || modelConfig.maxTokens;
    const temperature = options.temperature || modelConfig.temperature;
    const systemPrompt = options.systemPrompt || generateSystemPrompt(options);
    
    // Log the request (without sensitive information)
    console.log(`Sending request to OpenRouter API for image analysis: ${imageUrl.substring(0, 50)}...`);
    console.log(`Using model: ${model}`);
    
    // Prepare the request payload
    const payload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this product image and provide detailed information about its condition.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      response_format: { type: 'json_object' }
    };

    // Set request timeout (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Make the API request
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Product Condition Analyzer'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error types
      if (response.status === 401 || response.status === 403) {
        throw {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Authentication failed with OpenRouter API',
          details: errorData,
          httpStatus: response.status
        };
      } else if (response.status === 429) {
        throw {
          code: ERROR_CODES.RATE_LIMIT_ERROR,
          message: 'Rate limit exceeded for OpenRouter API',
          details: errorData,
          httpStatus: response.status
        };
      } else if (response.status >= 500) {
        throw {
          code: ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'OpenRouter service is currently unavailable',
          details: errorData,
          httpStatus: response.status
        };
      } else {
        throw {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: `OpenRouter API error: ${response.statusText}`,
          details: errorData,
          httpStatus: response.status
        };
      }
    }

    // Parse the response
    const data = await response.json();
    
    // Validate the response structure
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw {
        code: ERROR_CODES.INVALID_RESPONSE,
        message: 'Invalid response format from OpenRouter API',
        details: data,
        httpStatus: 200
      };
    }

    // Log success (without sensitive information)
    console.log(`OpenRouter API response received successfully. Response ID: ${data.id}`);
    
    return data;
  } catch (error) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw {
        code: ERROR_CODES.TIMEOUT_ERROR,
        message: 'Request to OpenRouter API timed out',
        details: { timeout: '30 seconds' },
        httpStatus: 408
      };
    }
    
    // If error is already formatted, rethrow it
    if (error.code && error.message) {
      throw error;
    }
    
    // Format other errors
    console.error('OpenRouter API error:', error);
    throw {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || 'Unknown error occurred while communicating with OpenRouter API',
      details: error,
      httpStatus: 500
    };
  }
};

/**
 * Gets the appropriate model configuration based on detail level and other options
 * @param {Object} options - Options for model selection
 * @returns {Object} - The model configuration object
 */
export const getModelConfig = (options = {}) => {
  const detailLevel = options.detailLevel || 'standard';
  
  switch (detailLevel.toLowerCase()) {
    case 'basic':
      return MODEL_CONFIGS.BASIC;
    case 'detailed':
      return MODEL_CONFIGS.DETAILED;
    case 'standard':
    default:
      return MODEL_CONFIGS.STANDARD;
  }
};

/**
 * Selects the appropriate model based on detail level and other options
 * @param {Object} options - Options for model selection
 * @returns {string} - The selected model identifier
 */
export const selectModel = (options = {}) => {
  const detailLevel = options.detailLevel || 'standard';
  const useFallback = options.useFallback || false;
  
  if (useFallback) {
    switch (detailLevel.toLowerCase()) {
      case 'basic':
        return MODELS.FALLBACK_BASIC;
      case 'detailed':
        return MODELS.FALLBACK_DETAILED;
      case 'standard':
      default:
        return MODELS.FALLBACK_STANDARD;
    }
  } else {
    switch (detailLevel.toLowerCase()) {
      case 'basic':
        return MODELS.BASIC;
      case 'detailed':
        return MODELS.DETAILED;
      case 'standard':
      default:
        return MODELS.STANDARD;
    }
  }
};

/**
 * Generates a system prompt for product analysis
 * @param {Object} options - Options for the prompt
 * @returns {string} - The system prompt
 */
export const generateSystemPrompt = (options = {}) => {
  const detailLevel = options.detailLevel || 'standard';
  const prioritizeCondition = options.prioritizeCondition !== undefined ? options.prioritizeCondition : true;
  const productCategory = options.productCategory || null;
  const focusAreas = options.focusAreas || [];
  
  // Base prompt that all detail levels will include
  let basePrompt = `You are a product condition analysis expert with extensive experience in evaluating products from images.

Your task is to analyze the provided product image and extract detailed information about:
1. The product's identity (type, brand, model, etc.)
2. The product's physical characteristics
3. The product's current condition

IMPORTANT: You must format your response as a valid JSON object with the structure defined at the end of this prompt.`;

  // Add product category specific instructions if provided
  if (productCategory) {
    basePrompt += `\n\nThe image is likely of a ${productCategory}. Focus your analysis on characteristics and condition aspects relevant to this product category.`;
  }

  // Detail level specific instructions
  let detailInstructions = '';
  
  switch (detailLevel.toLowerCase()) {
    case 'basic':
      detailInstructions = `
Focus on the most obvious and clearly visible aspects of the product.
Provide a high-level assessment of the product's condition without extensive detail.
If you're uncertain about specific details, it's better to omit them than to guess.
Keep your analysis concise and straightforward.
Limit your analysis to the most important features and condition indicators.`;
      break;
      
    case 'detailed':
      detailInstructions = `
Perform an extremely thorough analysis of the product.
Look for subtle details that might indicate the product's condition.
Consider manufacturing details, serial numbers, model variants, and other specific identifiers.
Analyze materials with precision, noting any specific types or grades of materials used.
Provide detailed measurements when possible.
Note even minor signs of wear, damage, or defects.
Consider the product's age based on design elements, manufacturing techniques, or other temporal indicators.
If relevant, comment on the product's value retention based on its condition.
Look for any unique or custom features that might affect the product's value or condition assessment.
Consider the product's authenticity indicators if applicable (for branded items).
Evaluate the quality of any repairs or modifications if visible.`;
      break;
      
    case 'standard':
    default:
      detailInstructions = `
Provide a balanced analysis with moderate detail.
Focus on clearly identifiable aspects of the product while also noting less obvious details when possible.
Include relevant information about materials, dimensions, and features.
Note significant signs of wear, damage, or defects.
Estimate the product's age when possible based on visible indicators.
Consider the overall presentation and condition relative to what would be expected for this type of product.
Identify any notable features that affect the product's functionality or value.`;
      break;
  }

  // Add focus area specific instructions
  if (focusAreas && focusAreas.length > 0) {
    detailInstructions += '\n\nPay special attention to the following aspects:';
    
    focusAreas.forEach(area => {
      switch (area) {
        case 'authenticity':
          detailInstructions += '\n- Look for authenticity indicators such as logos, serial numbers, quality of materials, and craftsmanship';
          break;
        case 'damage':
          detailInstructions += '\n- Carefully examine for any signs of damage, including scratches, dents, tears, cracks, or other structural issues';
          break;
        case 'functionality':
          detailInstructions += '\n- Assess whether the product appears to be in working condition and identify any visible issues that might affect functionality';
          break;
        case 'value':
          detailInstructions += '\n- Consider factors that might affect the product\'s value, such as rarity, condition, completeness, and market demand';
          break;
        case 'age':
          detailInstructions += '\n- Look for indicators of the product\'s age, such as design elements, manufacturing techniques, wear patterns, or dated components';
          break;
        default:
          detailInstructions += `\n- ${area}`;
      }
    });
  }

  // Condition assessment instructions (prioritized or balanced)
  let conditionInstructions = '';
  
  if (prioritizeCondition) {
    conditionInstructions = `
PRIORITIZE CONDITION ASSESSMENT: Your primary focus should be on accurately assessing the product's condition.

When evaluating condition:
- Look carefully for signs of wear, damage, scratches, dents, discoloration, or other defects
- Consider functional aspects that might be affected by the condition
- Rate the overall condition on this scale: New, Like New, Good, Fair, Poor
- Provide specific details about condition issues in the conditionDetails section
- Be thorough in your conditionExplanation, describing why you've assigned the particular rating
- Assign a confidenceScore (0-100) that reflects how certain you are about your condition assessment

Condition Rating Guidelines:
- NEW: Item appears unused, in original packaging, or with original tags/labels. No signs of wear or damage.
- LIKE NEW: Item appears barely used with minimal to no signs of wear. All components present and in excellent condition.
- GOOD: Item shows some signs of use but remains in good working condition with minor cosmetic issues.
- FAIR: Item shows significant wear or has some damage but remains functional. May have missing minor components.
- POOR: Item has extensive damage, heavy wear, or significant missing/broken components. Functionality may be impaired.
- UNKNOWN: If you cannot confidently assess the condition, use this rating and explain why.`;
  } else {
    conditionInstructions = `
When evaluating condition:
- Balance your focus between identifying the product and assessing its condition
- Look for obvious signs of wear, damage, or defects
- Rate the overall condition on this scale: New, Like New, Good, Fair, Poor, Unknown
- Provide relevant details about condition issues in the conditionDetails section
- Explain your condition rating in the conditionExplanation field
- Assign a confidenceScore (0-100) that reflects how certain you are about your condition assessment

Condition Rating Guidelines:
- NEW: Item appears unused, in original packaging, or with original tags/labels
- LIKE NEW: Item appears barely used with minimal signs of wear
- GOOD: Item shows some signs of use but remains in good condition
- FAIR: Item shows significant wear or has some damage
- POOR: Item has extensive damage or heavy wear
- UNKNOWN: If you cannot confidently assess the condition`;
  }

  // Response format instructions
  const responseFormatInstructions = `
YOUR RESPONSE MUST BE A VALID JSON OBJECT with the following structure:

{
  "productInfo": {
    "type": "string", // Required: General product category
    "brand": "string", // Optional: Brand name if identifiable
    "model": "string", // Optional: Model name/number if identifiable
    "color": "string", // Optional: Primary color(s)
    "materials": ["string"], // Optional: Array of materials used
    "dimensions": { // Optional: Physical dimensions if estimable
      "width": number,
      "height": number,
      "depth": number,
      "unit": "string" // e.g., "cm", "inches"
    },
    "features": ["string"], // Optional: Notable features
    "estimatedAge": "string", // Optional: Estimated age or year of manufacture
    "certaintyScore": number // Required: 0-100 confidence in product identification
  },
  "conditionAssessment": {
    "overallCondition": "string", // Required: One of "New", "Like New", "Good", "Fair", "Poor", "Unknown"
    "conditionDetails": {
      "wearSigns": ["string"], // Optional: Visible signs of wear
      "damages": ["string"], // Optional: Specific damages
      "defects": ["string"], // Optional: Manufacturing or other defects
      "positiveAspects": ["string"] // Optional: Positive condition aspects
    },
    "conditionExplanation": "string", // Required: Detailed explanation of condition rating
    "confidenceScore": number // Required: 0-100 confidence in condition assessment
  }
}

IMPORTANT: Ensure your response is properly formatted JSON with no markdown formatting or additional text outside the JSON structure.`;

  // Combine all sections into the final prompt
  return `${basePrompt}

${detailInstructions}

${conditionInstructions}

${responseFormatInstructions}`;
};