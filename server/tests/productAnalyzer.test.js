/**
 * Product Analyzer API Tests
 * Tests for the product analyzer API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import the router and services
import productAnalyzerRoutes from '../routes/productAnalyzer.js';
import { urlValidationService } from '../services/productAnalyzer/index.js';
import { validateProductAnalysisRequest } from '../middleware/validation.js';
import { queueProductAnalysisRequest } from '../middleware/requestQueue.js';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/product-analyzer', productAnalyzerRoutes);
  
  // Add error handling middleware for tests
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: {
        code: err.code || 'SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
        details: err.details
      }
    });
  });
  
  return app;
};

describe('Product Analyzer API', () => {
  let app;
  let validateImageUrlStub;

  beforeEach(() => {
    // Create a fresh app for each test
    app = createTestApp();

    // Stub the validateImageUrl function
    validateImageUrlStub = vi.spyOn(urlValidationService, 'validateImageUrl');
    validateImageUrlStub.mockResolvedValue({ isValid: true });
  });

  afterEach(() => {
    // Restore all stubs
    vi.restoreAllMocks();
  });
  
  describe('POST /api/product-analyzer/analyze', () => {
    it('should return 400 if imageUrl is missing', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
    
    it('should return 400 if imageUrl is not a string', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({ imageUrl: 123 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FIELD_TYPES');
    });
    
    it('should return 400 if options is not an object', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({ imageUrl: 'https://example.com/image.jpg', options: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FIELD_TYPES');
    });

    it('should return 400 if detailLevel is invalid', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({
          imageUrl: 'https://example.com/image.jpg',
          options: { detailLevel: 'invalid' }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DETAIL_LEVEL');
    });
    
    it('should return 400 if URL validation fails', async () => {
      // Set up the stub to return invalid
      validateImageUrlStub.mockResolvedValue({ isValid: false, error: 'Invalid URL format' });

      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({ imageUrl: 'invalid-url' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_IMAGE_URL');
    });
    
    it('should return 200 with default options if URL is valid', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({ imageUrl: 'https://example.com/image.jpg' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toBe('https://example.com/image.jpg');
      expect(response.body.data.options.detailLevel).toBe('standard');
      expect(response.body.data.options.prioritizeCondition).toBe(true);
    });

    it('should return 200 with custom options if provided', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({
          imageUrl: 'https://example.com/image.jpg',
          options: {
            detailLevel: 'detailed',
            prioritizeCondition: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.options.detailLevel).toBe('detailed');
      expect(response.body.data.options.prioritizeCondition).toBe(false);
    });

    it('should include timing information in the response', async () => {
      const response = await request(app)
        .post('/api/product-analyzer/analyze')
        .send({ imageUrl: 'https://example.com/image.jpg' });

      expect(response.status).toBe(200);
      expect(response.body.data.timing).toHaveProperty('total');
      expect(response.body.data.timing.total).toContain('ms');
    });
  });
});