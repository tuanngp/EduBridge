/**
 * Product Analyzer Routes
 * This module defines the API routes for the product analyzer feature
 */

import express from 'express';
import multer from 'multer';
import {
  urlValidationService,
  cloudinaryService,
  openRouterService,
  productAnalysisService,
  responseFormatterService,
} from '../services/productAnalyzer/index.js';
import { validateProductAnalysisRequest } from '../middleware/validation.js';
import { errorLogger, apiErrorHandler, createError } from '../middleware/errorHandler.js';
import { queueProductAnalysisRequest } from '../middleware/requestQueue.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

/**
 * POST /api/product-analyzer/upload
 * Uploads an image file to Cloudinary
 */
router.post('/upload', upload.single('image'), async (req, res, next) => {
  const startTime = Date.now();
  const requestId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  try {
    if (!req.file) {
      throw createError(
        'No image file provided',
        'ValidationError',
        400,
        'MISSING_IMAGE_FILE'
      );
    }

    console.log(`[${requestId}] Image upload request received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(req.file, {
      folder: 'edubridge/product-analyzer',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    });

    const processingTime = Date.now() - startTime;

    console.log(`[${requestId}] Image uploaded successfully: ${uploadResult.url}`);

    return res.status(200).json({
      success: true,
      requestId,
      data: {
        message: 'Image uploaded successfully',
        imageUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes
        },
        timing: {
          total: `${processingTime}ms`
        }
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Upload error:`, error);
    next(error);
  }
});

/**
 * POST /api/product-analyzer/analyze
 * Analyzes a product image
 */
router.post('/analyze', 
  validateProductAnalysisRequest,
  queueProductAnalysisRequest,
  async (req, res, next) => {
    const startTime = Date.now();
    const requestId = `pa-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      const { imageUrl, options = {} } = req.body;

      // Log the request
      console.log(`[${requestId}] Product analysis request received for: ${imageUrl}`);

      let finalImageUrl = imageUrl;
      let cloudinaryUpload = null;

      // Handle different image input types
      if (imageUrl.startsWith('data:image/')) {
        // Data URL (from camera capture) - upload to Cloudinary
        console.log(`[${requestId}] Uploading data URL to Cloudinary`);
        cloudinaryUpload = await cloudinaryService.uploadImage(imageUrl, {
          folder: 'edubridge/product-analyzer',
          resource_type: 'image',
          quality: 'auto'
        });
        finalImageUrl = cloudinaryUpload.url;
        console.log(`[${requestId}] Data URL uploaded to Cloudinary: ${finalImageUrl}`);
      } else {
        // Regular URL - validate it
        const urlValidation = await urlValidationService.validateImageUrl(imageUrl);
        if (!urlValidation.isValid) {
          throw createError(
            urlValidation.error,
            'ValidationError',
            400,
            'INVALID_IMAGE_URL',
            { imageUrl }
          );
        }
      }
      
      // Set default options if not provided
      const analysisOptions = {
        detailLevel: options.detailLevel || 'standard',
        prioritizeCondition: options.prioritizeCondition !== undefined ? options.prioritizeCondition : true,
        ...options
      };
      
      // Send the image to OpenRouter for analysis
      console.log(`[${requestId}] Sending image to OpenRouter for analysis: ${finalImageUrl}`);
      
      // Track timing for OpenRouter API call
      const openRouterStartTime = Date.now();
      
      try {
        // Call OpenRouter API with the image URL
        const openRouterResponse = await openRouterService.analyzeImage(finalImageUrl, {
          detailLevel: analysisOptions.detailLevel,
          prioritizeCondition: analysisOptions.prioritizeCondition
        });
        
        const openRouterTime = Date.now() - openRouterStartTime;
        
        console.log(`[${requestId}] OpenRouter analysis completed in ${openRouterTime}ms`);
        
        // Parse and analyze the AI response
        console.log(`[${requestId}] Processing analysis result`);
        const analysisStartTime = Date.now();
        
        const rawAIResponse = openRouterResponse.choices[0].message.content;
        const productAnalysis = await productAnalysisService.analyzeProduct(rawAIResponse);
        
        // Format the result for the frontend
        const formattedResult = responseFormatterService.formatAnalysisResult(
          productAnalysis,
          finalImageUrl,
          requestId
        );
        
        const analysisTime = Date.now() - analysisStartTime;
        const totalProcessingTime = Date.now() - startTime;
        
        console.log(`[${requestId}] Analysis processing completed in ${analysisTime}ms`);
        
        // Build response metadata
        const responseMetadata = {
          openRouterResponseId: openRouterResponse.id,
          timing: {
            openRouter: `${openRouterTime}ms`,
            analysis: `${analysisTime}ms`,
            total: `${totalProcessingTime}ms`,
          },
          options: analysisOptions
        };
        
        // Include Cloudinary upload information if applicable
        if (cloudinaryUpload) {
          responseMetadata.cloudinary = {
            publicId: cloudinaryUpload.publicId,
            width: cloudinaryUpload.width,
            height: cloudinaryUpload.height,
            format: cloudinaryUpload.format,
            bytes: cloudinaryUpload.bytes
          };
        }
        
        // Add debug information in development
        if (process.env.NODE_ENV === 'development') {
          responseMetadata.debug = {
            rawAIResponse: rawAIResponse.substring(0, 500) + '...',
            originalImageUrl: imageUrl
          };
        }
        
        return res.status(200).json({
          success: true,
          requestId,
          data: formattedResult,
          metadata: responseMetadata
        });
      } catch (error) {
        console.error(`[${requestId}] OpenRouter API error:`, error);
        
        // Format the error response
        const errorResponse = {
          code: error.code || 'OPENROUTER_ERROR',
          message: error.message || 'An error occurred during product analysis',
          details: error.details || {},
          httpStatus: error.httpStatus || 500
        };
        
        return res.status(errorResponse.httpStatus).json({
          success: false,
          requestId,
          error: errorResponse
        });
      }
    } catch (error) {
      // Pass the error to the error handling middleware
      next(error);
    }
  }
);

export default router;