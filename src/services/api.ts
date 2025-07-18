const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Callback function to handle authentication failures
let onAuthFailure: (() => void) | null = null;

// Import notification system (will be available after Layout is mounted)
let showNotificationFn: ((notification: { type: 'error' | 'success' | 'info'; message: string; duration?: number }) => void) | null = null;

export const setNotificationFunction = (fn: typeof showNotificationFn) => {
  showNotificationFn = fn;
};

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token immediately on initialization
    this.loadToken();
    // Add debug log to verify token loading
    console.log('ApiService initialized, token loaded:', this.token ? 'Token exists' : 'No token found');
  }

  // Method to set the authentication failure callback
  setAuthFailureCallback(callback: () => void) {
    onAuthFailure = callback;
  }

  // Utility method for testing - manually clear tokens
  clearTokensForTesting() {
    this.removeToken();
    console.log('Tokens cleared for testing');
  }

  private loadToken() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.token = token;
      console.log('Token loaded from localStorage');
    } else {
      console.log('No token found in localStorage');
    }
  }

  private saveToken(token: string): boolean {
    try {
      this.token = token;
      localStorage.setItem('accessToken', token);
      
      // Verify token was saved correctly
      const savedToken = localStorage.getItem('accessToken');
      const success = savedToken === token;
      
      console.log('Token save attempt:', success ? 'Success' : 'Failed');
      return success;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  private removeToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private handleAuthError() {
    this.removeToken();
    
    // Show user-friendly notification
    if (showNotificationFn) {
      showNotificationFn({
        type: 'error',
        message: 'Your session has expired. Please log in again.',
        duration: 4000
      });
    }
    
    if (onAuthFailure) {
      onAuthFailure();
    } else {
      // Fallback: redirect to login page
      window.location.href = '/';
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Always check localStorage first in case token was updated elsewhere
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken && (!this.token || storedToken !== this.token)) {
      console.log('Token found in localStorage but not in memory, updating memory token');
      this.token = storedToken;
    }

    if (this.token) {
      console.log(`Adding Authorization header for request to ${endpoint}`);
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    } else {
      console.log(`No token available for request to ${endpoint}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors (401: Unauthorized, 403: Forbidden/Invalid token)
      if (response.status === 401 || response.status === 403) {
        // Try to refresh token first
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          } else if (retryResponse.status === 401 || retryResponse.status === 403) {
            // Even after refresh, still getting auth errors - token is definitely invalid
            this.handleAuthError();
            throw new Error('Authentication failed');
          }
          
          // Handle other errors from retry
          const retryData = await retryResponse.json();
          throw new Error(retryData.error || 'Request failed');
        } else {
          // Refresh failed - clear tokens and logout
          this.handleAuthError();
          throw new Error('Authentication failed');
        }
      }

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error messages for common HTTP errors
        let errorMessage = data.error || 'Request failed';
        
        if (response.status === 400) {
          errorMessage = data.error || 'Invalid request. Please check your input.';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (response.status === 409) {
          errorMessage = data.error || 'This operation conflicts with existing data.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
          // Show notification for server errors
          if (showNotificationFn) {
            showNotificationFn({
              type: 'error',
              message: 'Server is experiencing issues. Please try again later.',
              duration: 6000
            });
          }
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // If it's a network error or fetch error, don't treat as auth failure
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error:', error);
        
        // Show network error notification
        if (showNotificationFn) {
          showNotificationFn({
            type: 'error',
            message: 'Network connection failed. Please check your internet connection.',
            duration: 6000
          });
        }
        
        throw new Error('Network connection failed');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      console.log('Attempting to refresh access token...');
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.saveToken(data.accessToken);
        // Update refresh token if provided
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('Token refreshed successfully');
        return true;
      } else {
        // Refresh token is also invalid or expired
        console.log('Refresh token expired or invalid');
        this.removeToken();
        
        // Show specific message for expired session
        if (showNotificationFn) {
          showNotificationFn({
            type: 'error',
            message: 'Your session has fully expired. Please log in again.',
            duration: 5000
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.removeToken();
      
      // Show network error if it's a network issue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (showNotificationFn) {
          showNotificationFn({
            type: 'error',
            message: 'Unable to refresh session. Please check your connection and try again.',
            duration: 6000
          });
        }
      }
      
      return false;
    }
  }

  // Auth methods
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<ApiResponse<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }>> {
    try {
      console.log('Sending registration request:', { email: userData.email, role: userData.role });
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const responseData = await response.json();
      console.log('Registration response received:', JSON.stringify(responseData));
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }
      
      // Ensure we have the required data
      if (!responseData.accessToken || !responseData.refreshToken || !responseData.user) {
        console.error('Invalid response format from server:', responseData);
        throw new Error('Invalid response from server');
      }
      
      // Save tokens directly
      console.log('Saving tokens from registration response');
      this.token = responseData.accessToken;
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('refreshToken', responseData.refreshToken);
      
      // Verify token storage
      const savedAccessToken = localStorage.getItem('accessToken');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      
      console.log('Token verification:', {
        accessTokenSaved: savedAccessToken === responseData.accessToken,
        refreshTokenSaved: savedRefreshToken === responseData.refreshToken,
        inMemoryToken: this.token === responseData.accessToken
      });
      
      return { data: responseData };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error during registration' };
    }
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }>> {
    try {
      console.log('Sending login request with credentials:', { email: credentials.email });
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const responseData = await response.json();
      console.log('Login response received:', JSON.stringify(responseData));
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Login failed');
      }
      
      // Ensure we have the required data
      if (!responseData.accessToken || !responseData.refreshToken || !responseData.user) {
        console.error('Invalid response format from server:', responseData);
        throw new Error('Invalid response from server');
      }
      
      // Save tokens directly without using the request method
      console.log('Saving tokens from login response');
      this.token = responseData.accessToken;
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('refreshToken', responseData.refreshToken);
      
      // Verify token storage
      const savedAccessToken = localStorage.getItem('accessToken');
      const savedRefreshToken = localStorage.getItem('refreshToken');
      
      console.log('Token verification:', {
        accessTokenSaved: savedAccessToken === responseData.accessToken,
        refreshTokenSaved: savedRefreshToken === responseData.refreshToken,
        inMemoryToken: this.token === responseData.accessToken
      });
      
      return { data: responseData };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error during login' };
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore errors during logout - still clear local tokens
      console.warn('Logout request failed, but clearing local tokens:', error);
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    try {
      console.log('Fetching current user data');
      
      // Get token from localStorage to ensure we're using the latest
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, cannot get current user');
        return { error: 'No access token available' };
      }
      
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseData = await response.json();
      console.log('Current user response:', JSON.stringify(responseData));
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Try token refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry with new token
            return this.getCurrentUser();
          } else {
            // Refresh failed
            this.handleAuthError();
            return { error: 'Authentication failed' };
          }
        }
        
        throw new Error(responseData.error || 'Failed to get current user');
      }
      
      return { data: responseData };
    } catch (error) {
      console.error('Get current user error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error getting user data' };
    }
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Donor methods
  async createDonorProfile(profileData: {
    organization: string;
    phone: string;
    address?: string;
  }) {
    return this.request<{ donor: any }>('/donors/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getDonorProfile() {
    return this.request<{ donor: any }>('/donors/profile');
  }

  async getDonorDevices() {
    return this.request<{ devices: any[] }>('/donors/devices');
  }

  async getSchoolsForDonor() {
    return this.request<{ schools: any[] }>('/donors/schools');
  }

  // School methods
  async createSchoolProfile(profileData: {
    school_name: string;
    address: string;
    phone: string;
    student_count?: number;
    contact_person: string;
    verification_documents?: any;
  }) {
    return this.request<{ school: any }>('/schools/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getSchoolProfile() {
    return this.request<{ school: any }>('/schools/profile');
  }

  async createNeed(needData: {
    device_type: string;
    quantity: number;
    description: string;
    priority?: string;
  }) {
    return this.request<{ need: any }>('/schools/needs', {
      method: 'POST',
      body: JSON.stringify(needData),
    });
  }

  async getSchoolNeeds() {
    return this.request<{ needs: any[] }>('/schools/needs');
  }

  async getAvailableDevices(filters?: {
    device_type?: string;
    condition?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.device_type) params.append('device_type', filters.device_type);
    if (filters?.condition) params.append('condition', filters.condition);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/schools/available-devices?${queryString}` : '/schools/available-devices';
    
    return this.request<{ devices: any[] }>(endpoint);
  }

  async getSchoolTransfers() {
    return this.request<{ transfers: any[] }>('/schools/transfers');
  }

  // Device methods
  async createDevice(deviceData: {
    name: string;
    description: string;
    device_type: string;
    condition: string;
    quantity: number;
    images?: string[];
  }) {
    return this.request<{ device: any }>('/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async getDevice(id: string) {
    return this.request<{ device: any }>(`/devices/${id}`);
  }

  async updateDevice(id: string, deviceData: Partial<{
    name: string;
    description: string;
    device_type: string;
    condition: string;
    quantity: number;
    images: string[];
  }>) {
    return this.request<{ device: any }>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
  }

  async deleteDevice(id: string) {
    return this.request(`/devices/${id}`, { method: 'DELETE' });
  }

  async getDevices(filters?: {
    device_type?: string;
    condition?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.device_type) params.append('device_type', filters.device_type);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/devices?${queryString}` : '/devices';
    
    return this.request<{ devices: any[] }>(endpoint);
  }

  // Transfer methods
  async createTransfer(transferData: {
    device_id: string;
    school_id: string;
    message?: string;
  }) {
    return this.request<{ transfer: any }>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async getTransfers(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/transfers?${queryString}` : '/transfers';
    
    return this.request<{ transfers: any[] }>(endpoint);
  }

  async updateTransferStatus(id: string, statusData: {
    status: string;
    notes?: string;
    received_images?: string[];
  }) {
    return this.request<{ transfer: any }>(`/transfers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async getTransfer(id: string) {
    return this.request<{ transfer: any }>(`/transfers/${id}`);
  }

  // Admin methods
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getUsers(filters?: {
    role?: string;
    is_verified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return this.request<{ users: any[] }>(endpoint);
  }

  async verifyUser(id: string, is_verified: boolean) {
    return this.request<{ user: any }>(`/admin/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ is_verified }),
    });
  }

  async getAdminDevices(filters?: {
    status?: string;
    device_type?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.device_type) params.append('device_type', filters.device_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/devices?${queryString}` : '/admin/devices';
    
    return this.request<{ devices: any[] }>(endpoint);
  }

  async approveDevice(id: string, status: 'approved' | 'rejected', admin_notes?: string) {
    return this.request<{ device: any }>(`/admin/devices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_notes }),
    });
  }

  async getAdminSchools(filters?: {
    is_verified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/schools?${queryString}` : '/admin/schools';
    
    return this.request<{ schools: any[] }>(endpoint);
  }

  async verifySchool(id: string, is_verified: boolean, admin_notes?: string) {
    return this.request<{ school: any }>(`/admin/schools/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ is_verified, admin_notes }),
    });
  }

  async getAdminTransfers(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/transfers?${queryString}` : '/admin/transfers';
    
    return this.request<{ transfers: any[] }>(endpoint);
  }

  async getAdminNeeds(filters?: {
    status?: string;
    device_type?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.device_type) params.append('device_type', filters.device_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/needs?${queryString}` : '/admin/needs';
    
    return this.request<{ needs: any[] }>(endpoint);
  }

  private async handleUploadAuth(url: string, body: FormData): Promise<Response> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body,
      });

      // Handle authentication errors for upload
      if (response.status === 401 || response.status === 403) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry upload with new token
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
            body,
          });
          
          if (retryResponse.ok) {
            return retryResponse;
          } else if (retryResponse.status === 401 || retryResponse.status === 403) {
            this.handleAuthError();
            throw new Error('Authentication failed');
          }
          
          return retryResponse;
        } else {
          this.handleAuthError();
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed');
      }
      throw error;
    }
  }

  // Upload methods with proper error handling
  async uploadImage(file: File, folder?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);

    try {
      const response = await this.handleUploadAuth(`${this.baseURL}/upload/image`, formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed');
      }
      throw error;
    }
  }

  async uploadImages(files: File[], folder?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    if (folder) formData.append('folder', folder);

    try {
      const response = await this.handleUploadAuth(`${this.baseURL}/upload/images`, formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed');
      }
      throw error;
    }
  }

  // Debug helper method to check authentication status
  checkAuthStatus(): { isAuthenticated: boolean; tokenInMemory: boolean; tokenInStorage: boolean } {
    const tokenInMemory = !!this.token;
    const tokenInStorage = !!localStorage.getItem('accessToken');
    const isAuthenticated = tokenInMemory && tokenInStorage;
    
    console.log('Auth Status Check:', {
      isAuthenticated,
      tokenInMemory,
      tokenInStorage,
      memoryToken: this.token ? `${this.token.substring(0, 10)}...` : null,
      storageToken: tokenInStorage ? `${localStorage.getItem('accessToken')?.substring(0, 10)}...` : null
    });
    
    return { isAuthenticated, tokenInMemory, tokenInStorage };
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;