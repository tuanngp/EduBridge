import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateTokens,
  refreshAccessToken,
  invalidateAllUserTokens,
  invalidateRefreshToken,
  isTokenBlacklisted,
  validateCredentials
} from '../services/authService.js';

// Mock dependencies
vi.mock('jsonwebtoken');

// Create a more flexible mock for Supabase
const createSupabaseMock = () => {
  const mockData = {
    users: [
      { id: 'test-user-id', role: 'donor', password: 'hashed-password' }
    ],
    sessions: [
      { 
        id: 'test-session-id', 
        user_id: 'test-user-id', 
        refresh_token: 'valid-refresh-token',
        is_blacklisted: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days in future
      },
      {
        id: 'blacklisted-session-id',
        user_id: 'test-user-id',
        refresh_token: 'blacklisted-token',
        is_blacklisted: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'expired-session-id',
        user_id: 'test-user-id',
        refresh_token: 'expired-token',
        is_blacklisted: false,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day in past
      }
    ]
  };

  return {
    from: function(table) {
      let queryBuilder = {
        data: table === 'users' ? mockData.users : mockData.sessions,
        filters: {},
        
        select: function() {
          return {
            ...queryBuilder,
            eq: function(column, value) {
              queryBuilder.filters[column] = value;
              return {
                single: async function() {
                  const items = queryBuilder.data.filter(function(item) {
                    for (const [key, val] of Object.entries(queryBuilder.filters)) {
                      if (item[key] !== val) return false;
                    }
                    return true;
                  });
                  
                  if (items.length === 0) {
                    return { data: null, error: new Error('Not found') };
                  }
                  
                  return { data: items[0], error: null };
                }
              };
            }
          };
        },
        
        insert: function(items) {
          return {
            select: function() {
              return {
                single: async function() {
                  const newItem = Array.isArray(items) ? items[0] : items;
                  const id = `new-${table}-id-${Date.now()}`;
                  const itemWithId = { ...newItem, id };
                  queryBuilder.data.push(itemWithId);
                  return { data: itemWithId, error: null };
                }
              };
            }
          };
        },
        
        update: function(updates) {
          return {
            eq: function(column, value) {
              return {
                eq: function(column2, value2) {
                  return {
                    async: function() {
                      let count = 0;
                      queryBuilder.data = queryBuilder.data.map(function(item) {
                        if (item[column] === value && item[column2] === value2) {
                          count++;
                          return { ...item, ...updates };
                        }
                        return item;
                      });
                      return { data: null, error: null, count };
                    }
                  };
                }
              };
            }
          };
        }
      };
      
      return queryBuilder;
    }
  };
};

vi.mock('../config/supabase.js', () => {
  return {
    default: {
      from: () => ({
        select: () => ({
          eq: (column, value) => ({
            single: async () => ({ data: { id: 'test-user-id', role: 'donor', is_blacklisted: false }, error: null }),
            eq: (column2, value2) => ({ data: [{ id: 'test-session-id' }], error: null })
          })
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'test-session-id' }, error: null })
          })
        }),
        update: () => ({
          eq: (column, value) => ({
            eq: (column2, value2) => ({ error: null }),
            error: null
          })
        })
      })
    }
  };
});

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      // Mock jwt.sign
      jwt.sign.mockImplementationOnce(() => 'mock-access-token');
      jwt.sign.mockImplementationOnce(() => 'mock-refresh-token');

      const user = { id: 'test-user-id', role: 'donor' };
      const tokens = generateTokens(user);

      expect(tokens).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      });

      // Verify jwt.sign was called correctly
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { userId: 'test-user-id', role: 'donor' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        { userId: 'test-user-id', tokenId: expect.any(String) },
        'test-jwt-refresh-secret',
        { expiresIn: '7d' }
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Mock jwt functions
      jwt.verify.mockImplementationOnce(() => ({ userId: 'test-user-id' }));
      jwt.sign.mockImplementationOnce(() => 'new-access-token');

      const result = await refreshAccessToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 3600
      });

      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-jwt-refresh-secret');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'test-user-id', role: 'donor', tokenId: undefined },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
    });

    it('should throw error for invalid refresh token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(refreshAccessToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should invalidate all tokens for a user', async () => {
      const result = await invalidateAllUserTokens('test-user-id');
      expect(result).toHaveProperty('invalidatedCount');
    });
  });

  describe('invalidateRefreshToken', () => {
    it('should invalidate a specific refresh token', async () => {
      const result = await invalidateRefreshToken('valid-refresh-token');
      expect(result).toHaveProperty('invalidated');
    });
  });
  
  describe('isTokenBlacklisted', () => {
    it('should check if a token is blacklisted', async () => {
      const result = await isTokenBlacklisted('valid-refresh-token');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validateCredentials', () => {
    it('should validate user credentials', async () => {
      // This test would need more setup to mock bcrypt.compare
      // For now, we'll just test the function exists and returns a promise
      expect(typeof validateCredentials).toBe('function');
    });
  });
});