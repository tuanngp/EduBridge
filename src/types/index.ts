export type UserRole = 'donor' | 'school' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface Donor {
  id: string;
  userId: string;
  organization: string;
  phone: string;
  createdAt: string;
}

export interface School {
  id: string;
  userId: string;
  schoolName: string;
  location: string;
  phone: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  name: string;
  description: string;
  deviceType: string;
  condition: 'new' | 'used-good' | 'used-fair';
  quantity: number;
  status: 'available' | 'claimed' | 'completed';
  createdAt: string;
}

export interface Request {
  id: string;
  schoolId: string;
  deviceType: string;
  quantity: number;
  description: string;
  status: 'open' | 'fulfilled';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  loading: boolean;
}