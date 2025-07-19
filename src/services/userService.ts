import { User } from '../types';
import { supabase } from './supabaseClient';

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data as User[];
};

export const saveUser = async (user: User): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving user:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
  
  return data as User;
};