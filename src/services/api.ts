const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('accessToken');
  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  private removeToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request
          headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        
        // If refresh failed, logout
        this.removeToken();
        window.location.href = '/';
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

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
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  // Auth methods
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      this.saveToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.saveToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.removeToken();
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
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

  // Upload methods
  async uploadImage(file: File, folder?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);

    const response = await fetch(`${this.baseURL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async uploadImages(files: File[], folder?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    if (folder) formData.append('folder', folder);

    const response = await fetch(`${this.baseURL}/upload/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;