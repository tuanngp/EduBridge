import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';

/**
 * Generate JWT tokens (access and refresh)
 * @param {Object} user - User object
 * @returns {Object} - Object containing access and refresh tokens
 */
export const generateTokens = (user) => {
  // Access token expires in 1 hour (as per requirement 1.1)
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Refresh token expires in 7 days (as per requirement 1.1)
  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600 // 1 hour in seconds
  };
};

/**
 * Store refresh token in database
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @param {string} userAgent - User agent
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - Stored session
 */
export const storeRefreshToken = async (userId, refreshToken, userAgent, ipAddress) => {
  // Decode token to get expiry
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  
  // Store token in database
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      id: uuidv4(),
      user_id: userId,
      refresh_token: refreshToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to store refresh token');
  }

  return data;
};

/**
 * Verify refresh token and generate new access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - Object containing new access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database and is not blacklisted
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .single();

    if (error || !session) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is blacklisted
    if (session.is_blacklisted) {
      throw new Error('Token has been revoked');
    }

    // Check if token has expired in database (double check)
    const now = new Date();
    const expiryDate = new Date(session.expires_at);
    if (now > expiryDate) {
      throw new Error('Refresh token has expired');
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, tokenId: decoded.tokenId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Update last used timestamp for the refresh token
    await supabase
      .from('user_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('refresh_token', refreshToken);

    return {
      accessToken,
      expiresIn: 3600 // 1 hour in seconds
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token format');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else {
      throw new Error(error.message || 'Invalid refresh token');
    }
  }
};

/**
 * Invalidate all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result of the operation with count of invalidated tokens
 */
export const invalidateAllUserTokens = async (userId) => {
  // Get all active sessions for the user
  const { data: sessions, error: fetchError } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_blacklisted', false);

  if (fetchError) {
    throw new Error('Failed to fetch user sessions');
  }

  // If no active sessions, return early
  if (!sessions || sessions.length === 0) {
    return { invalidatedCount: 0 };
  }

  // Invalidate all sessions
  const { error } = await supabase
    .from('user_sessions')
    .update({ 
      is_blacklisted: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_blacklisted', false);

  if (error) {
    throw new Error('Failed to invalidate tokens');
  }

  return { invalidatedCount: sessions.length };
};

/**
 * Invalidate a specific refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - Result of the operation
 */
export const invalidateRefreshToken = async (refreshToken) => {
  // Check if token exists and is not already blacklisted
  const { data: session, error: fetchError } = await supabase
    .from('user_sessions')
    .select('id, is_blacklisted')
    .eq('refresh_token', refreshToken)
    .single();

  if (fetchError) {
    throw new Error('Token not found');
  }

  // If already blacklisted, return early
  if (session.is_blacklisted) {
    return { alreadyInvalidated: true };
  }

  // Invalidate the token
  const { error } = await supabase
    .from('user_sessions')
    .update({ 
      is_blacklisted: true,
      updated_at: new Date().toISOString()
    })
    .eq('refresh_token', refreshToken);

  if (error) {
    throw new Error('Failed to invalidate token');
  }

  return { invalidated: true };
};

/**
 * Check if a refresh token is blacklisted
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<boolean>} - True if token is blacklisted
 */
export const isTokenBlacklisted = async (refreshToken) => {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('is_blacklisted')
    .eq('refresh_token', refreshToken)
    .single();

  if (error || !data) {
    // If token doesn't exist, consider it blacklisted
    return true;
  }

  return data.is_blacklisted;
};

/**
 * Validate user credentials and return user if valid
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User object if credentials are valid
 */
export const validateCredentials = async (email, password) => {
  // Find user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  return user;
};

/**
 * Clean up expired sessions
 * @returns {Promise<void>}
 */
export const cleanupExpiredSessions = async () => {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', now);

  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
};