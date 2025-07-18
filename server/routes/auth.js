import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { 
  generateTokens, 
  storeRefreshToken, 
  refreshAccessToken, 
  invalidateRefreshToken,
  invalidateAllUserTokens,
  validateCredentials
} from '../services/authService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['donor', 'school', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    const verificationToken = uuidv4();

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        password: hashedPassword,
        name,
        role,
        is_verified: false,
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const tokens = generateTokens(user);
    
    // Store refresh token
    try {
      await storeRefreshToken(
        user.id, 
        tokens.refreshToken, 
        req.headers['user-agent'] || 'unknown', 
        req.ip
      );
    } catch (tokenError) {
      console.error('Token storage error:', tokenError);
      // Continue even if token storage fails
    }

    // Remove sensitive data
    const { password: _, verification_token: __, ...userResponse } = user;

    res.status(201).json({
      user: userResponse,
      ...tokens,
      message: 'Registration successful. Please check your email for verification.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Validate credentials
      const user = await validateCredentials(email, password);
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      // Store refresh token with device info
      await storeRefreshToken(
        user.id, 
        tokens.refreshToken, 
        req.headers['user-agent'] || 'unknown', 
        req.ip
      );

      // Remove sensitive data
      const { password: _, verification_token: __, ...userResponse } = user;

      res.json({
        user: userResponse,
        ...tokens
      });
    } catch (authError) {
      return res.status(401).json({ error: authError.message });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Update user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        verification_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
      // Use the refreshAccessToken service to generate a new access token
      const tokens = await refreshAccessToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      return res.status(403).json({ error: error.message || 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { password, verification_token, ...userResponse } = req.user;
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Invalidate the specific refresh token
      await invalidateRefreshToken(refreshToken);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Invalidate all refresh tokens for this user (requirement 1.4)
    await invalidateAllUserTokens(userId);

    // Generate new tokens
    const tokens = generateTokens(req.user);
    
    // Store new refresh token
    await storeRefreshToken(
      userId, 
      tokens.refreshToken, 
      req.headers['user-agent'] || 'unknown', 
      req.ip
    );

    res.json({
      message: 'Password changed successfully. All other sessions have been logged out.',
      ...tokens
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;