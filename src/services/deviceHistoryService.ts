import { DeviceHistoryItem } from '../components/common/DeviceHistoryTimeline';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchDeviceHistory = async (deviceId: string): Promise<DeviceHistoryItem[]> => {
  try {
    const response = await fetch(`${API_URL}/device-history/${deviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching device history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.history;
  } catch (error) {
    console.error('Error in fetchDeviceHistory:', error);
    throw error;
  }
};

// Function to subscribe to real-time updates for device history
export const subscribeToDeviceHistory = (
  deviceId: string,
  callback: (history: DeviceHistoryItem[]) => void
) => {
  // First fetch the initial data
  fetchDeviceHistory(deviceId)
    .then(history => {
      callback(history);
    })
    .catch(error => {
      console.error('Error fetching initial device history:', error);
    });

  // Set up polling for updates every 30 seconds
  // This is a fallback approach when real-time WebSockets are not available
  const pollingInterval = setInterval(() => {
    fetchDeviceHistory(deviceId)
      .then(history => {
        callback(history);
      })
      .catch(error => {
        console.error('Error polling device history:', error);
      });
  }, 30000); // Poll every 30 seconds

  // Also set up Supabase real-time subscription if available
  let subscription: { unsubscribe: () => void } | null = null;
  
  try {
    subscription = supabase
      .channel(`device_history_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_history',
          filter: `device_id=eq.${deviceId}`
        },
        () => {
          // When a change is detected, fetch the updated history
          fetchDeviceHistory(deviceId)
            .then(history => {
              callback(history);
            })
            .catch(error => {
              console.error('Error fetching updated device history:', error);
            });
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Error setting up real-time subscription:', error);
    // Continue with polling as fallback
  }

  // Return unsubscribe function that cleans up both methods
  return () => {
    clearInterval(pollingInterval);
    if (subscription) {
      subscription.unsubscribe();
    }
  };
};