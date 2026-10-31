import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from './types';

// Hardcoded Supabase credentials as fallback strings (does not rely solely on import.meta.env)
export const SUPABASE_PROJECT_ID = 'arierwpjaksxxnmvbqwn';
export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://arierwpjaksxxnmvbqwn.supabase.co';
export const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'ap-southeast-1';

/**
 * Directly initialized Supabase client with hardcoded fallback strings
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Supabase instance object pattern compatible with Flutter / Dart API syntax:
 * Supabase.instance.client.from('orders')...
 */
export const Supabase = {
  get instance() {
    return {
      client: supabase,
    };
  },
  client: supabase,
};

/**
 * acceptJob: When accepted, updates order status to 'IN_TRANSIT' and associates driver_id
 * Future<void> acceptJob(String orderId, String driverId)
 */
export async function acceptJob(orderId: string, driverId: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'IN_TRANSIT',
      updated_at: timestamp,
    })
    .eq('id', orderId);

  if (error) {
    console.warn('[Supabase] acceptJob notice:', error.message);
  }
}

/**
 * sendLocationPing: Updates driver coordinates on order row
 * void sendLocationPing(String orderId, double lat, double lng)
 */
export async function sendLocationPing(orderId: string, lat: number, lng: number): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      driver_lat: lat,
      driver_lng: lng,
    })
    .eq('id', orderId);

  if (error) {
    console.warn('[Supabase] sendLocationPing notice:', error.message);
  }
}

export default supabase;
