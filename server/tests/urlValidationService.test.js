/**
 * URL Validation Service Tests
 * Tests for the URL validation service functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  isValidUrlFormat,
  isUrlAccessible,
  isImageUrl,
  validateImageSize,
  validateImageUrl,
  validateUrlFormatOnly
} from '../services/productAnalyzer/urlValidationService.js';

// Mock axios
vi.mock('axios');

describe('URL Validation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidUrlFormat', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrlFormat('http://example.com')).toBe(true);
      expect(isValidUrlFormat('http://example.com/image.jpg')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrlFormat('https://example.com')).toBe(true);
      expect(isValidUrlFormat('https://example.com/image.jpg')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrlFormat('not-a-url')).toBe(false);
      expect(isValidUrlFormat('ftp://example.com')).toBe(false);
      expect(isValidUrlFormat('')).toBe(false);
      expect(isValidUrlFormat('javascript:alert(1)')).toBe(false);
    });

    it('should return false for non-HTTP/HTTPS protocols', () => {
      expect(isValidUrlFormat('ftp://example.com')).toBe(false);
      expect(isValidUrlFormat('file:///path/to/file')).toBe(false);
      expect(isValidUrlFormat('data:image/png;base64,abc')).toBe(false);
    });
  });

  describe('isUrlAccessible', () => {
    it('should return true for accessible URLs (HEAD request)', async () => {
      axios.head.mockResolvedValue({ status: 200 });

      const result = await isUrlAccessible('https://example.com/image.jpg');
      expect(result).toBe(true);
      expect(axios.head).toHaveBeenCalledWith('https://example.com/image.jpg', {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: expect.any(Function)
      });
    });

    it('should return true for accessible URLs with 3xx status', async () => {
      axios.head.mockResolvedValue({ status: 301 });

      const result = await isUrlAccessible('https://example.com/image.jpg');
      expect(result).toBe(true);
    });

    it('should fallback to GET request if HEAD fails', async () => {
      axios.head.mockRejectedValue(new Error('HEAD not supported'));
      axios.get.mockResolvedValue({ status: 200 });

      const result = await isUrlAccessible('https://example.com/image.jpg');
      expect(result).toBe(true);
      expect(axios.head).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledWith('https://example.com/image.jpg', {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'Range': 'bytes=0-1023' },
        validateStatus: expect.any(Function)
      });
    });

    it('should return false if both HEAD and GET fail', async () => {
      axios.head.mockRejectedValue(new Error('HEAD failed'));
      axios.get.mockRejectedValue(new Error('GET failed'));

      const result = await isUrlAccessible('https://example.com/nonexistent.jpg');
      expect(result).toBe(false);
    });

    it('should return false for 4xx and 5xx status codes', async () => {
      axios.head.mockResolvedValue({ status: 404 });

      const result = await isUrlAccessible('https://example.com/notfound.jpg');
      expect(result).toBe(false);
    });
  });

  describe('isImageUrl', () => {
    it('should return true for URLs with image extensions and image content-type', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/jpeg' }
      });

      const result = await isImageUrl('https://example.com/image.jpg');
      expect(result).toBe(true);
    });

    it('should return true for URLs with image content-type but no extension', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/png' }
      });

      const result = await isImageUrl('https://example.com/image');
      expect(result).toBe(true);
    });

    it('should return true for URLs with image extensions but no content-type', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: {}
      });

      const result = await isImageUrl('https://example.com/image.png');
      expect(result).toBe(true);
    });

    it('should return false for non-image content-type and no image extension', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'text/html' }
      });

      const result = await isImageUrl('https://example.com/page.html');
      expect(result).toBe(false);
    });

    it('should fallback to GET request if HEAD fails', async () => {
      axios.head.mockRejectedValue(new Error('HEAD failed'));
      axios.get.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/gif' }
      });

      const result = await isImageUrl('https://example.com/image.gif');
      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should fallback to extension check if both HEAD and GET fail', async () => {
      axios.head.mockRejectedValue(new Error('HEAD failed'));
      axios.get.mockRejectedValue(new Error('GET failed'));

      const result = await isImageUrl('https://example.com/image.webp');
      expect(result).toBe(true); // Should return true based on extension
    });

    it('should support various image extensions', async () => {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'];
      
      for (const ext of extensions) {
        axios.head.mockRejectedValue(new Error('Failed'));
        axios.get.mockRejectedValue(new Error('Failed'));
        
        const result = await isImageUrl(`https://example.com/image${ext}`);
        expect(result).toBe(true);
      }
    });
  });

  describe('validateImageSize', () => {
    it('should return valid for images within size limit', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-length': '5000000' } // 5MB
      });

      const result = await validateImageSize('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
      expect(result.size).toBe(5000000);
    });

    it('should return invalid for images exceeding size limit', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-length': '15000000' } // 15MB
      });

      const result = await validateImageSize('https://example.com/large.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
      expect(result.size).toBe(15000000);
    });

    it('should return valid if content-length is not available', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: {}
      });

      const result = await validateImageSize('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
      expect(result.size).toBe(null);
    });

    it('should use custom size limit', async () => {
      axios.head.mockResolvedValue({
        status: 200,
        headers: { 'content-length': '3000000' } // 3MB
      });

      const result = await validateImageSize('https://example.com/image.jpg', 2 * 1024 * 1024); // 2MB limit
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should return valid if size check fails', async () => {
      axios.head.mockRejectedValue(new Error('Failed'));

      const result = await validateImageSize('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
      expect(result.size).toBe(null);
    });
  });

  describe('validateUrlFormatOnly', () => {
    it('should return valid for properly formatted URLs', () => {
      const result = validateUrlFormatOnly('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for malformed URLs', () => {
      const result = validateUrlFormatOnly('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should return invalid for non-string input', () => {
      const result = validateUrlFormatOnly(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should handle whitespace trimming', () => {
      const result = validateUrlFormatOnly('  https://example.com/image.jpg  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateImageUrl (comprehensive)', () => {
    it('should return valid for a properly formatted, accessible image URL', async () => {
      // Mock successful responses
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'content-length': '5000000' }
        }); // isImageUrl and validateImageSize

      const result = await validateImageUrl('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for malformed URL', async () => {
      const result = await validateImageUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should return invalid for inaccessible URL', async () => {
      axios.head.mockRejectedValue(new Error('Network error'));
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await validateImageUrl('https://example.com/nonexistent.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not accessible');
    });

    it('should return invalid for non-image URL', async () => {
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'text/html' }
        }); // isImageUrl

      const result = await validateImageUrl('https://example.com/page.html');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not point to an image');
    });

    it('should return invalid for oversized image', async () => {
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'image/jpeg' }
        }) // isImageUrl
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-length': '15000000' } // 15MB
        }); // validateImageSize

      const result = await validateImageUrl('https://example.com/large.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
      expect(result.details.size).toBe(15000000);
    });

    it('should skip size check when checkSize is false', async () => {
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'image/jpeg' }
        }); // isImageUrl

      const result = await validateImageUrl('https://example.com/image.jpg', { checkSize: false });
      expect(result.isValid).toBe(true);
      expect(axios.head).toHaveBeenCalledTimes(2); // Should not call validateImageSize
    });

    it('should handle non-string input', async () => {
      const result = await validateImageUrl(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should handle empty string input', async () => {
      const result = await validateImageUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should trim whitespace from URL', async () => {
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'content-length': '5000000' }
        }); // isImageUrl and validateImageSize

      const result = await validateImageUrl('  https://example.com/image.jpg  ');
      expect(result.isValid).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      axios.head.mockRejectedValue(new Error('Unexpected error'));
      axios.get.mockRejectedValue(new Error('Unexpected error'));

      const result = await validateImageUrl('https://example.com/image.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not accessible'); // The function correctly identifies this as an accessibility issue
    });

    it('should use custom options', async () => {
      axios.head
        .mockResolvedValueOnce({ status: 200 }) // isUrlAccessible
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-type': 'image/jpeg' }
        }) // isImageUrl
        .mockResolvedValueOnce({
          status: 200,
          headers: { 'content-length': '3000000' } // 3MB
        }); // validateImageSize

      const result = await validateImageUrl('https://example.com/image.jpg', {
        maxSizeBytes: 2 * 1024 * 1024, // 2MB limit
        checkSize: true
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });
});
