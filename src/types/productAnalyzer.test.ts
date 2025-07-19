import { describe, it, expect } from 'vitest';
import {
  AnalysisRequest,
  AnalysisResponse,
  ProductInfo,
  ConditionRating,
  ConditionAssessment,
  AnalysisResult
} from './productAnalyzer';

describe('Product Analyzer Types', () => {
  it('should create a valid AnalysisRequest', () => {
    const request: AnalysisRequest = {
      imageUrl: 'https://example.com/image.jpg',
      options: {
        detailLevel: 'standard',
        prioritizeCondition: true
      }
    };
    
    expect(request.imageUrl).toBe('https://example.com/image.jpg');
    expect(request.options?.detailLevel).toBe('standard');
    expect(request.options?.prioritizeCondition).toBe(true);
  });
  
  it('should create a valid ProductInfo object', () => {
    const productInfo: ProductInfo = {
      type: 'Laptop',
      brand: 'Example Brand',
      model: 'X1000',
      color: 'Silver',
      materials: ['Aluminum', 'Plastic'],
      dimensions: {
        width: 30,
        height: 20,
        depth: 1.5,
        unit: 'cm'
      },
      features: ['Backlit Keyboard', 'Touchscreen'],
      estimatedAge: '2-3 years',
      certaintyScore: 85
    };
    
    expect(productInfo.type).toBe('Laptop');
    expect(productInfo.certaintyScore).toBe(85);
    expect(productInfo.materials?.length).toBe(2);
  });
  
  it('should create a valid ConditionAssessment object', () => {
    const assessment: ConditionAssessment = {
      overallCondition: ConditionRating.GOOD,
      conditionDetails: {
        wearSigns: ['Minor scratches on lid'],
        damages: [],
        defects: [],
        positiveAspects: ['Clean keyboard', 'No screen damage']
      },
      conditionExplanation: 'The laptop is in good condition with only minor cosmetic wear.',
      confidenceScore: 90
    };
    
    expect(assessment.overallCondition).toBe(ConditionRating.GOOD);
    expect(assessment.confidenceScore).toBe(90);
    expect(assessment.conditionDetails.wearSigns?.length).toBe(1);
    expect(assessment.conditionDetails.positiveAspects?.length).toBe(2);
  });
  
  it('should create a valid AnalysisResult object', () => {
    const result: AnalysisResult = {
      requestId: '123456',
      timestamp: '2025-07-19T12:00:00Z',
      imageUrl: 'https://example.com/image.jpg',
      productInfo: {
        type: 'Laptop',
        brand: 'Example Brand',
        certaintyScore: 85
      },
      conditionAssessment: {
        overallCondition: ConditionRating.GOOD,
        conditionDetails: {},
        conditionExplanation: 'Good condition overall.',
        confidenceScore: 90
      },
      summary: 'This laptop is in good condition with minor wear.'
    };
    
    expect(result.requestId).toBe('123456');
    expect(result.productInfo.type).toBe('Laptop');
    expect(result.conditionAssessment.overallCondition).toBe(ConditionRating.GOOD);
    expect(result.summary).toBeTruthy();
  });
});