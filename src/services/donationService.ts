import { Device } from '../types';
import { supabase } from './supabaseClient';

export const getDonations = async (): Promise<Device[]> => {
  const { data, error } = await supabase
    .from('devices')
    .select('*');
  
  if (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
  
  return data as Device[];
};

export const saveDonation = async (donation: Device): Promise<void> => {
  const { error } = await supabase
    .from('devices')
    .upsert(donation, { onConflict: 'id' });
  
  if (error) {
    console.error('Error saving donation:', error);
  }
};

export const getDonationsByDonorId = async (donorId: string): Promise<Device[]> => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('donor_id', donorId);
  
  if (error) {
    console.error('Error fetching donations by donor ID:', error);
    return [];
  }
  
  return data as Device[];
};