import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up authentication failure callback
    apiService.setAuthFailureCallback(() => {
      handleAuthFailure();
    });

    loadCurrentUser();
  }, []);

  const handleAuthFailure = () => {
    // Clear user state when authentication fails
    setUser(null);
    setLoading(false);
  };

  const loadCurrentUser = async () => {
    try {
      console.log('AuthContext: Attempting to load current user...');
      const response = await apiService.getCurrentUser();
      
      if (response.error) {
        console.error('AuthContext: Failed to load current user:', response.error);
        
        // Check if we have tokens but no user data
        const hasToken = localStorage.getItem('accessToken');
        if (hasToken) {
          console.log('AuthContext: Token exists but user data fetch failed, will retry after delay');
          
          // Retry after a short delay
          setTimeout(async () => {
            try {
              const retryResponse = await apiService.getCurrentUser();
              if (retryResponse.data && retryResponse.data.user) {
                console.log('AuthContext: Retry successful, user loaded:', retryResponse.data.user);
                setUser(retryResponse.data.user);
              } else {
                console.error('AuthContext: Retry failed, no user data returned or error:', retryResponse.error);
              }
            } catch (retryError) {
              console.error('AuthContext: Retry to load user failed:', retryError);
            } finally {
              setLoading(false);
            }
          }, 1000);
          return; // Don't set loading to false yet
        }
      } else if (response.data && response.data.user) {
        console.log('AuthContext: Current user loaded successfully:', response.data.user);
        setUser(response.data.user);
      } else {
        console.warn('AuthContext: getCurrentUser returned no user data in response');
      }
    } catch (error) {
      console.error('AuthContext: Failed to load current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('AuthContext: Attempting login with email:', email);
      const response = await apiService.login({ email, password });
      
      if (response.error) {
        console.error('AuthContext: Login failed with error:', response.error);
        return false;
      }
      
      if (response.data && response.data.user) {
        console.log('AuthContext: Login successful, setting user state');
        setUser(response.data.user);
        
        // Verify token storage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!accessToken || !refreshToken) {
          console.error('AuthContext: Login successful but tokens not stored properly!');
          console.log('Access token exists:', !!accessToken);
          console.log('Refresh token exists:', !!refreshToken);
          
          // Try to save tokens again if missing
          if (!accessToken && response.data.accessToken) {
            console.log('AuthContext: Attempting to re-save access token');
            localStorage.setItem('accessToken', response.data.accessToken);
          }
          
          if (!refreshToken && response.data.refreshToken) {
            console.log('AuthContext: Attempting to re-save refresh token');
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
        }
        
        return true;
      }
      
      console.error('AuthContext: Login response missing user data:', response);
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole
  ): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('AuthContext: Attempting registration with email:', email);
      const response = await apiService.register({ email, password, name, role });
      
      if (response.error) {
        console.error('AuthContext: Registration failed with error:', response.error);
        return false;
      }
      
      if (response.data && response.data.user) {
        console.log('AuthContext: Registration successful, setting user state');
        setUser(response.data.user);
        
        // Verify token storage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!accessToken || !refreshToken) {
          console.error('AuthContext: Registration successful but tokens not stored properly!');
          
          // Try to save tokens again if missing
          if (!accessToken && response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
          }
          
          if (!refreshToken && response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
        }
        
        return true;
      }
      
      console.error('AuthContext: Registration response missing user data:', response);
      return false;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't worry about logout errors - we still want to clear local state
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      await apiService.verifyEmail(token);
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    verifyEmail,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};