/**
 * Error Handler Middleware
 * This module provides middleware functions for error handling
 */

/**
 * Logs errors to the console with additional request information
 */
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp
  };
  
  console.error('ERROR LOG:', timestamp);
  console.error('Request:', JSON.stringify(requestInfo));
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  next(err);
};

/**
 * Handles API errors and sends appropriate responses
 */
export const apiErrorHandler = (err, req, res, next) => {
  // Default to 500 internal server error
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  
  // Don't expose stack traces in production
  const details = process.env.NODE_ENV === 'development' 
    ? { stack: err.stack, ...err.details } 
    : err.details;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details
    }
  });
};

/**
 * Creates a custom error with additional properties
 * @param {string} message - Error message
 * @param {string} name - Error name
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} - Custom error object
 */
export const createError = (message, name = 'Error', statusCode = 500, code = 'SERVER_ERROR', details = {}) => {
  const error = new Error(message);
  error.name = name;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
};