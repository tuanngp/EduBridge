import { calculateMatchScore, getNeedStatusDetails } from '../services/deviceSuggestionService.js';
import supabase from '../config/supabase.js';

// Mock supabase
jest.mock('../config/supabase.js', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}));

describe('Device Suggestion Service', () => {
  describe('calculateMatchScore', () => {
    test('should return 100 for perfect match', () => {
      const device = {
        device_type: 'Laptop',
        condition: 'new',
        quantity: 5,
        specifications: {
          RAM: '8GB',
          Storage: '256GB SSD',
          Processor: 'Intel i5'
        }
      };
      
      const need = {
        device_type: 'Laptop',
        quantity: 5,
        min_condition: 'new',
        priority: 'medium',
        specifications: {
          RAM: '8GB',
          Storage: '256GB SSD',
          Processor: 'Intel i5'
        }
      };
      
      const score = calculateMatchScore(device, need);
      expect(score).toBeGreaterThanOrEqual(90);
    });
    
    test('should return high score for similar device types', () => {
      const device = {
        device_type: 'Notebook',
        condition: 'new',
        quantity: 3
      };
      
      const need = {
        device_type: 'Laptop',
        quantity: 3,
        priority: 'medium'
      };
      
      const score = calculateMatchScore(device, need);
      expect(score).toBeGreaterThanOrEqual(40);
    });
    
    test('should penalize for worse condition than required', () => {
      const device = {
        device_type: 'Laptop',
        condition: 'used-fair',
        quantity: 1
      };
      
      const need = {
        device_type: 'Laptop',
        quantity: 1,
        min_condition: 'new',
        priority: 'medium'
      };
      
      const score = calculateMatchScore(device, need);
      const perfectScore = calculateMatchScore({...device, condition: 'new'}, need);
      expect(score).toBeLessThan(perfectScore);
    });
    
    test('should adjust score based on priority', () => {
      const device = {
        device_type: 'Tablet',
        condition: 'new',
        quantity: 2
      };
      
      const lowPriorityNeed = {
        device_type: 'Tablet',
        quantity: 2,
        priority: 'low'
      };
      
      const urgentPriorityNeed = {
        device_type: 'Tablet',
        quantity: 2,
        priority: 'urgent'
      };
      
      const lowScore = calculateMatchScore(device, lowPriorityNeed);
      const urgentScore = calculateMatchScore(device, urgentPriorityNeed);
      
      expect(urgentScore).toBeGreaterThan(lowScore);
    });
    
    test('should handle partial quantity match', () => {
      const device = {
        device_type: 'Monitor',
        condition: 'new',
        quantity: 3
      };
      
      const need = {
        device_type: 'Monitor',
        quantity: 5,
        priority: 'medium'
      };
      
      const score = calculateMatchScore(device, need);
      const perfectScore = calculateMatchScore({...device, quantity: 5}, need);
      
      expect(score).toBeLessThan(perfectScore);
      expect(score).toBeGreaterThan(0);
    });
    
    test('should handle specification matching', () => {
      const device = {
        device_type: 'Laptop',
        condition: 'new',
        quantity: 1,
        specifications: {
          RAM: '16GB',
          Storage: '512GB SSD',
          Processor: 'Intel i7'
        }
      };
      
      const need = {
        device_type: 'Laptop',
        quantity: 1,
        priority: 'medium',
        specifications: {
          RAM: '8GB',
          Storage: '256GB SSD',
          Processor: 'Intel i5'
        }
      };
      
      const score = calculateMatchScore(device, need);
      expect(score).toBeGreaterThanOrEqual(60);
    });
    
    test('should handle missing specifications gracefully', () => {
      const device = {
        device_type: 'Printer',
        condition: 'used-good',
        quantity: 1
      };
      
      const need = {
        device_type: 'Printer',
        quantity: 1,
        priority: 'medium',
        specifications: {
          Type: 'Laser'
        }
      };
      
      // This should not throw an error
      expect(() => calculateMatchScore(device, need)).not.toThrow();
    });
  });

  describe('getNeedStatusDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return need with status timestamps', async () => {
      // Mock data
      const mockNeed = {
        id: '123',
        device_type: 'Laptop',
        quantity: 2,
        status: 'in-transit',
        priority: 'high',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-05T00:00:00Z',
        status_history: [
          { status: 'pending', created_at: '2023-01-01T00:00:00Z' },
          { status: 'matched', created_at: '2023-01-02T00:00:00Z' },
          { status: 'in-transit', created_at: '2023-01-03T00:00:00Z' }
        ],
        matched_device: {
          id: '456',
          name: 'Dell XPS 13',
          device_type: 'Laptop',
          condition: 'used-good',
          donor: {
            name: 'John Doe',
            organization: 'Tech Corp'
          }
        }
      };

      // Setup mock
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({ data: mockNeed, error: null });

      // Call function
      const result = await getNeedStatusDetails('123');

      // Assertions
      expect(result).toEqual({
        ...mockNeed,
        matched_at: '2023-01-02T00:00:00Z',
        in_transit_at: '2023-01-03T00:00:00Z',
        delivered_at: null,
        completed_at: null
      });

      // Verify supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('needs');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', '123');
      expect(supabase.single).toHaveBeenCalled();
    });

    test('should handle error gracefully', async () => {
      // Setup mock with error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({ data: null, error: new Error('Database error') });

      // Call function
      const result = await getNeedStatusDetails('123');

      // Assertions
      expect(result).toBeNull();
    });

    test('should handle missing status history', async () => {
      // Mock data without status history
      const mockNeed = {
        id: '123',
        device_type: 'Laptop',
        quantity: 2,
        status: 'pending',
        priority: 'high',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        status_history: []
      };

      // Setup mock
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({ data: mockNeed, error: null });

      // Call function
      const result = await getNeedStatusDetails('123');

      // Assertions
      expect(result).toEqual({
        ...mockNeed,
        matched_at: null,
        in_transit_at: null,
        delivered_at: null,
        completed_at: null
      });
    });
  });
});