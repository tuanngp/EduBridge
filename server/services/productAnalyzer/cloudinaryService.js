/**
 * Cloudinary Service
 * This service handles image uploads to Cloudinary
 * Implemented in task 3.3
 */

import { cloudinary, uploadToCloudinary } from '../../config/cloudinary.js';
import axios from 'axios';

/**
 * Uploads an image from a data URL (base64 encoded)
 * @param {string} dataUrl - The data URL to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadFromDataUrl = async (dataUrl, options = {}) => {
  try {
    // Validate data URL format
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Invalid data URL format. Must start with "data:image/"');
    }

    // Extract the base64 data
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL: missing base64 data');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: 'edubridge/uploads',
      resource_type: 'image',
      ...options
    });

    return result;
  } catch (error) {
    console.error('Error uploading from data URL:', error);
    throw new Error(`Failed to upload from data URL: ${error.message}`);
  }
};

/**
 * Uploads an image from an external URL
 * @param {string} url - The external URL to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadFromUrl = async (url, options = {}) => {
  try {
    // Download the image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      headers: {
        'User-Agent': 'EduBridge-ProductAnalyzer/1.0'
      }
    });

    // Convert to buffer
    const buffer = Buffer.from(response.data);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: 'edubridge/uploads',
      resource_type: 'image',
      ...options
    });

    return result;
  } catch (error) {
    console.error('Error uploading from URL:', error);
    throw new Error(`Failed to upload from URL: ${error.message}`);
  }
};

/**
 * Uploads an image to Cloudinary
 * @param {string|Buffer|File} image - The image to upload (URL, buffer, data URL, or file)
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - The Cloudinary upload result with url, public_id, etc.
 */
export const uploadImage = async (image, options = {}) => {
  try {
    let result;

    // Handle different input types
    if (typeof image === 'string') {
      if (image.startsWith('data:image/')) {
        // Data URL (base64 encoded image)
        result = await uploadFromDataUrl(image, options);
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        // External URL
        result = await uploadFromUrl(image, options);
      } else {
        throw new Error('Invalid string input. Must be a data URL or HTTP/HTTPS URL');
      }
    } else if (Buffer.isBuffer(image)) {
      // Buffer
      result = await uploadToCloudinary(image, {
        folder: 'edubridge/uploads',
        resource_type: 'image',
        ...options
      });
    } else if (image && typeof image === 'object' && image.buffer) {
      // File object with buffer property (from multer)
      result = await uploadToCloudinary(image.buffer, {
        folder: 'edubridge/uploads',
        resource_type: 'image',
        original_filename: image.originalname,
        ...options
      });
    } else {
      throw new Error('Unsupported image input type. Must be a URL, data URL, Buffer, or File object');
    }

    // Return standardized result
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at,
      resourceType: result.resource_type,
      type: result.type,
      version: result.version,
      signature: result.signature,
      etag: result.etag
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Retrieves an image URL from Cloudinary using the public ID
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Optional transformations to apply
 * @returns {string} - The Cloudinary URL of the image
 */
export const getImageUrl = (publicId, transformations = {}) => {
  try {
    if (!publicId || typeof publicId !== 'string') {
      throw new Error('Public ID must be a non-empty string');
    }

    // Generate URL with optional transformations
    const url = cloudinary.url(publicId, {
      secure: true,
      resource_type: 'image',
      type: 'upload',
      ...transformations
    });

    return url;
  } catch (error) {
    console.error('Error generating Cloudinary URL:', error);
    throw new Error(`Failed to generate image URL: ${error.message}`);
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - The deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId || typeof publicId !== 'string') {
      throw new Error('Public ID must be a non-empty string');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }

    return {
      success: true,
      publicId,
      result: result.result
    };
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Gets image metadata from Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<Object>} - The image metadata
 */
export const getImageMetadata = async (publicId) => {
  try {
    if (!publicId || typeof publicId !== 'string') {
      throw new Error('Public ID must be a non-empty string');
    }

    const result = await cloudinary.api.resource(publicId);

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at,
      resourceType: result.resource_type,
      type: result.type,
      version: result.version,
      signature: result.signature,
      etag: result.etag,
      tags: result.tags || [],
      context: result.context || {}
    };
  } catch (error) {
    console.error('Error getting image metadata from Cloudinary:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Generates a thumbnail URL for an image
 * @param {string} publicId - The public ID of the image
 * @param {Object} options - Thumbnail options (width, height, crop, quality)
 * @returns {string} - The thumbnail URL
 */
export const getThumbnailUrl = (publicId, options = {}) => {
  const {
    width = 300,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return getImageUrl(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    fetch_format: 'auto'
  });
};

/**
 * Validates if an image exists in Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<boolean>} - True if the image exists, false otherwise
 */
export const imageExists = async (publicId) => {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (error) {
    if (error.http_code === 404) {
      return false;
    }
    console.error('Error checking if image exists:', error);
    throw new Error(`Failed to check image existence: ${error.message}`);
  }
};