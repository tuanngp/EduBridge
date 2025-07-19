import { Need } from '../types';
import { supabase } from './supabaseClient';

export const getRequests = async (): Promise<Need[]> => {
  const { data, error } = await supabase
    .from('needs')
    .select('*');
  
  if (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
  
  return data as Need[];
};

export const saveRequest = async (request: Need): Promise<void> => {
  const { error } = await supabase
    .from('needs')
    .upsert(request, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving request:', error);
  }
};

export const getRequestsBySchoolId = async (schoolId: string): Promise<Need[]> => {
  const { data, error } = await supabase
    .from('needs')
    .select('*')
    .eq('school_id', schoolId);
  
  if (error) {
    console.error('Error fetching requests by school ID:', error);
    return [];
  }
  
  return data as Need[];
};