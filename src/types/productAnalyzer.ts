// Product Condition Analyzer Types

// Request and Response Types
export interface AnalysisRequest {
  imageUrl: string;
  options?: {
    detailLevel?: 'basic' | 'standard' | 'detailed';
    prioritizeCondition?: boolean;
  };
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    openRouterResponseId?: string;
    timing?: {
      openRouter?: string;
      analysis?: string;
      total?: string;
    };
    options?: any;
    cloudinary?: any;
    debug?: any;
  };
}

// Product Information Types
export interface ProductInfo {
  type: string;
  brand?: string;
  model?: string;
  color?: string;
  materials?: string[];
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit?: string;
  };
  features?: string[];
  estimatedAge?: string;
  certaintyScore: number; // 0-100
}

// Condition Assessment Types
export enum ConditionRating {
  NEW = 'New',
  LIKE_NEW = 'Like New',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  UNKNOWN = 'Unknown'
}

export interface ConditionAssessment {
  overallCondition: ConditionRating;
  conditionDetails: {
    wearSigns?: string[];
    damages?: string[];
    defects?: string[];
    positiveAspects?: string[];
  };
  conditionExplanation: string;
  confidenceScore: number; // 0-100
}

// Analysis Result Type
export interface AnalysisResult {
  requestId: string;
  timestamp: string;
  imageUrl: string;
  productInfo: ProductInfo;
  conditionAssessment: ConditionAssessment;
  summary: string;
}

// OpenRouter Types
export interface OpenRouterOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  // Other fields from OpenRouter API
}

// Component Props Types
export interface ProductAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  initialUrl?: string;
  className?: string;
}

export interface ProductAnalyzerRef {
  analyze: (imageUrl: string) => Promise<AnalysisResult>;
  reset: () => void;
}

// Service Interface Types
export interface OpenRouterService {
  analyzeImage(imageUrl: string, options?: OpenRouterOptions): Promise<OpenRouterResponse>;
}

export interface ProductAnalysisService {
  analyzeProduct(aiResponse: string): Promise<ProductAnalysis>;
}

export interface ProductAnalysis {
  productInfo: ProductInfo;
  conditionAssessment: ConditionAssessment;
  rawAnalysis: string;
}

export interface ResponseFormatter {
  formatAnalysisResult(analysis: ProductAnalysis): AnalysisResult;
}

// Error Types
export interface ErrorResponse {
  success: false;
  error: {
    code: string;        // e.g., "INVALID_IMAGE_URL"
    message: string;     // User-friendly message
    details?: any;       // Additional error context
    httpStatus: number;  // HTTP status code
  };
}