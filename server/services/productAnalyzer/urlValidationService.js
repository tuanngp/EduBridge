/**
 * URL Validation Service
 * This service handles validation of image URLs
 * Implemented in task 3.2
 */

import axios from 'axios';

/**
 * Validates if a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid, false otherwise
 */
export const isValidUrlFormat = (url) => {
  try {
    const urlObj = new URL(url);
    // Ensure it's HTTP or HTTPS
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a URL is accessible
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - True if the URL is accessible, false otherwise
 */
export const isUrlAccessible = async (url) => {
  try {
    // Use HEAD request to check accessibility without downloading the full content
    const response = await axios.head(url, {
      timeout: 10000, // 10 second timeout
      maxRedirects: 5, // Allow up to 5 redirects
      validateStatus: (status) => status >= 200 && status < 400, // Accept 2xx and 3xx status codes
    });

    return response.status >= 200 && response.status < 400;
  } catch (error) {
    // If HEAD request fails, try a GET request with range header (to minimize data transfer)
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'Range': 'bytes=0-1023' // Only request first 1KB
        },
        validateStatus: (status) => status >= 200 && status < 400,
      });

      return response.status >= 200 && response.status < 400;
    } catch (fallbackError) {
      console.warn(`URL accessibility check failed for ${url}:`, fallbackError.message);
      return false;
    }
  }
};

/**
 * Validates if a URL points to an image
 * @param {string} url - The URL to validate
 * @returns {Promise<boolean>} - True if the URL points to an image, false otherwise
 */
export const isImageUrl = async (url) => {
  try {
    // First, check if the URL has a common image file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'];
    const lowerUrl = url.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

    // Make a HEAD request to check the Content-Type header
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentType = response.headers['content-type'] || '';
    const isImageContentType = contentType.startsWith('image/');

    // Consider it an image if either the extension or content-type indicates it's an image
    return hasImageExtension || isImageContentType;
  } catch (error) {
    // If HEAD request fails, try a GET request with range header
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'Range': 'bytes=0-1023' // Only request first 1KB to check headers
        },
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const contentType = response.headers['content-type'] || '';
      const isImageContentType = contentType.startsWith('image/');

      // Also check file extension as fallback
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'];
      const lowerUrl = url.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

      return hasImageExtension || isImageContentType;
    } catch (fallbackError) {
      // As a last resort, check only the file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'];
      const lowerUrl = url.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

      console.warn(`Image type validation failed for ${url}, falling back to extension check:`, fallbackError.message);
      return hasImageExtension;
    }
  }
};

/**
 * Validates the size of an image URL (checks if it's not too large)
 * @param {string} url - The URL to validate
 * @param {number} maxSizeBytes - Maximum allowed size in bytes (default: 10MB)
 * @returns {Promise<{isValid: boolean, size?: number, error?: string}>} - Size validation result
 */
export const validateImageSize = async (url, maxSizeBytes = 10 * 1024 * 1024) => {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentLength = response.headers['content-length'];
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSizeBytes) {
        return {
          isValid: false,
          size,
          error: `Image size (${Math.round(size / 1024 / 1024 * 100) / 100}MB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`
        };
      }
      return { isValid: true, size };
    }

    // If content-length is not available, we can't determine size
    return { isValid: true, size: null };
  } catch (error) {
    console.warn(`Image size validation failed for ${url}:`, error.message);
    // If we can't check size, we'll allow it (size check is optional)
    return { isValid: true, size: null };
  }
};

/**
 * Validates an image URL comprehensively
 * @param {string} url - The URL to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeBytes - Maximum allowed image size in bytes
 * @param {boolean} options.checkSize - Whether to check image size (default: true)
 * @returns {Promise<{isValid: boolean, error?: string, details?: Object}>} - Validation result
 */
export const validateImageUrl = async (url, options = {}) => {
  const { maxSizeBytes = 10 * 1024 * 1024, checkSize = true } = options;

  // Basic input validation
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  // Trim whitespace
  url = url.trim();

  // Check URL format
  if (!isValidUrlFormat(url)) {
    return { isValid: false, error: 'Invalid URL format. URL must be a valid HTTP or HTTPS URL.' };
  }

  try {
    // Check if URL is accessible
    const isAccessible = await isUrlAccessible(url);
    if (!isAccessible) {
      return { isValid: false, error: 'URL is not accessible. Please check if the URL is correct and the server is responding.' };
    }

    // Check if URL points to an image
    const isImage = await isImageUrl(url);
    if (!isImage) {
      return { isValid: false, error: 'URL does not point to an image. Please provide a URL that points to an image file.' };
    }

    // Optionally check image size
    if (checkSize) {
      const sizeValidation = await validateImageSize(url, maxSizeBytes);
      if (!sizeValidation.isValid) {
        return {
          isValid: false,
          error: sizeValidation.error,
          details: { size: sizeValidation.size }
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error(`URL validation error for ${url}:`, error);
    return {
      isValid: false,
      error: `Validation error: ${error.message}`,
      details: { originalError: error.message }
    };
  }
};

/**
 * Quick validation for URL format only (synchronous)
 * @param {string} url - The URL to validate
 * @returns {{isValid: boolean, error?: string}} - Format validation result
 */
export const validateUrlFormatOnly = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  const trimmedUrl = url.trim();
  if (!isValidUrlFormat(trimmedUrl)) {
    return { isValid: false, error: 'Invalid URL format. URL must be a valid HTTP or HTTPS URL.' };
  }

  return { isValid: true };
};