import { School } from '../types';
import { supabase } from './supabaseClient';

export const getSchools = async (): Promise<School[]> => {
  const { data, error } = await supabase
    .from('schools')
    .select('*');
  
  if (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
  
  return data as School[];
};

export const saveSchool = async (school: School): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .upsert(school, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving school:', error);
  }
};

export const getSchoolByUserId = async (userId: string): Promise<School | null> => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching school by user ID:', error);
    return null;
  }
  
  return data as School;
};