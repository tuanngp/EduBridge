/**
 * OpenRouter Service Tests
 * Tests for the OpenRouter service functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSystemPrompt, selectModel, analyzeImage } from './openRouterService.js';

// Mock environment variables and fetch
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

describe('OpenRouter Service', () => {
  describe('selectModel', () => {
    it('should select basic model when detail level is basic', () => {
      const options = { detailLevel: 'basic' };
      const model = selectModel(options);
      expect(model).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should select detailed model when detail level is detailed', () => {
      const options = { detailLevel: 'detailed' };
      const model = selectModel(options);
      expect(model).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should select standard model when detail level is standard', () => {
      const options = { detailLevel: 'standard' };
      const model = selectModel(options);
      expect(model).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should select standard model when detail level is not specified', () => {
      const options = {};
      const model = selectModel(options);
      expect(model).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should select standard model when detail level is invalid', () => {
      const options = { detailLevel: 'invalid' };
      const model = selectModel(options);
      expect(model).toBe('google/gemini-2.0-flash-exp:free');
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate a prompt with basic detail level', () => {
      const options = { detailLevel: 'basic', prioritizeCondition: true };
      const prompt = generateSystemPrompt(options);
      
      // Check that the prompt contains the basic detail level instructions
      expect(prompt).toContain('Focus on the most obvious and clearly visible aspects of the product');
      expect(prompt).toContain('Keep your analysis concise and straightforward');
      
      // Check that the prompt contains the prioritized condition instructions
      expect(prompt).toContain('PRIORITIZE CONDITION ASSESSMENT');
    });

    it('should generate a prompt with detailed detail level', () => {
      const options = { detailLevel: 'detailed', prioritizeCondition: false };
      const prompt = generateSystemPrompt(options);
      
      // Check that the prompt contains the detailed detail level instructions
      expect(prompt).toContain('Perform an extremely thorough analysis of the product');
      expect(prompt).toContain('Note even minor signs of wear, damage, or defects');
      
      // Check that the prompt contains the balanced condition instructions
      expect(prompt).not.toContain('PRIORITIZE CONDITION ASSESSMENT');
      expect(prompt).toContain('Balance your focus between identifying the product and assessing its condition');
    });

    it('should generate a prompt with standard detail level by default', () => {
      const options = {};
      const prompt = generateSystemPrompt(options);
      
      // Check that the prompt contains the standard detail level instructions
      expect(prompt).toContain('Provide a balanced analysis with moderate detail');
      expect(prompt).toContain('Note significant signs of wear, damage, or defects');
      
      // Check that the prompt contains the prioritized condition instructions by default
      expect(prompt).toContain('PRIORITIZE CONDITION ASSESSMENT');
    });

    it('should include the response format instructions in all prompts', () => {
      const options = { detailLevel: 'basic' };
      const prompt = generateSystemPrompt(options);
      
      // Check that the prompt contains the response format instructions
      expect(prompt).toContain('YOUR RESPONSE MUST BE A VALID JSON OBJECT');
      expect(prompt).toContain('"productInfo"');
      expect(prompt).toContain('"conditionAssessment"');
    });
  });
});