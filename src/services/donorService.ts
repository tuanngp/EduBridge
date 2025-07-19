import { Donor } from '../types';
import { supabase } from './supabaseClient';

export const getDonors = async (): Promise<Donor[]> => {
  const { data, error } = await supabase
    .from('donors')
    .select('*');
  
  if (error) {
    console.error('Error fetching donors:', error);
    return [];
  }
  
  return data as Donor[];
};

export const saveDonor = async (donor: Donor): Promise<void> => {
  const { error } = await supabase
    .from('donors')
    .upsert(donor, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving donor:', error);
  }
};

export const getDonorByUserId = async (userId: string): Promise<Donor | null> => {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching donor by user ID:', error);
    return null;
  }
  
  return data as Donor;
};