import { AnalysisRequest, AnalysisResponse } from '../types/productAnalyzer';
import apiService from './api';

/**
 * Service for handling product analysis requests
 * This service handles communication with the backend API for product analysis
 */
const productAnalyzerService = {
  /**
   * Analyze a product image
   * @param request The analysis request containing the image URL and options
   * @returns The analysis response
   */
  analyzeProduct: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    try {
      // Make a request to the backend API
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/product-analyzer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Analysis request failed');
      }
      
      // Transform the response to match the expected AnalysisResponse format
      return {
        success: data.success,
        data: data.data, // This is already in AnalysisResult format from the server
        metadata: data.metadata
      };
    } catch (error: any) {
      console.error('Product analysis error:', error);
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred during analysis',
          details: error.response?.data?.error?.details,
        },
      };
    }
  },
};

export default productAnalyzerService;