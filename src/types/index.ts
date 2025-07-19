export type UserRole = 'donor' | 'school' | 'admin';

// Export Product Analyzer types
export * from './productAnalyzer';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  verification_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  user_id: string;
  organization: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  user_id: string;
  school_name: string;
  address: string;
  phone: string;
  student_count?: number;
  contact_person: string;
  verification_documents?: any;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  donor_id: string;
  name: string;
  description: string;
  device_type: string;
  condition: 'new' | 'used-good' | 'used-fair';
  quantity: number;
  images?: any[];
  status: 'pending' | 'approved' | 'rejected' | 'matched' | 'completed';
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Need {
  id: string;
  school_id: string;
  device_type: string;
  quantity: number;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'fulfilled';
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  device_id: string;
  donor_id: string;
  school_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'delivered' | 'received';
  notes?: string;
  received_images?: any;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  loading: boolean;
}