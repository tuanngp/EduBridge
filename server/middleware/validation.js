/**
 * Validation Middleware
 * This module provides middleware functions for request validation
 */

/**
 * Validates that the request body contains required fields
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Function} - Express middleware function
 */
export const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => {
      return req.body[field] === undefined || req.body[field] === null;
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          details: { missingFields }
        }
      });
    }

    next();
  };
};

/**
 * Validates that the request body fields match expected types
 * @param {Object} fieldTypes - Object mapping field names to expected types
 * @returns {Function} - Express middleware function
 */
export const validateFieldTypes = (fieldTypes) => {
  return (req, res, next) => {
    const typeErrors = [];

    Object.entries(fieldTypes).forEach(([field, expectedType]) => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        const actualType = Array.isArray(req.body[field]) ? 'array' : typeof req.body[field];
        
        if (actualType !== expectedType) {
          typeErrors.push({
            field,
            expectedType,
            actualType
          });
        }
      }
    });

    if (typeErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FIELD_TYPES',
          message: 'One or more fields have invalid types',
          details: { typeErrors }
        }
      });
    }

    next();
  };
};

/**
 * Validates product analyzer request
 * Specifically for the /api/product-analyzer/analyze endpoint
 */
export const validateProductAnalysisRequest = [
  validateRequiredFields(['imageUrl']),
  validateFieldTypes({
    imageUrl: 'string',
    options: 'object'
  }),
  (req, res, next) => {
    // Validate options object if present
    if (req.body.options) {
      const { detailLevel, prioritizeCondition } = req.body.options;
      
      // Validate detailLevel if present
      if (detailLevel !== undefined && 
          !['basic', 'standard', 'detailed'].includes(detailLevel)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DETAIL_LEVEL',
            message: "Detail level must be one of: 'basic', 'standard', 'detailed'",
            details: { providedValue: detailLevel }
          }
        });
      }
      
      // Validate prioritizeCondition if present
      if (prioritizeCondition !== undefined && 
          typeof prioritizeCondition !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRIORITIZE_CONDITION',
            message: "prioritizeCondition must be a boolean value",
            details: { providedValue: prioritizeCondition }
          }
        });
      }
    }
    
    next();
  }
];