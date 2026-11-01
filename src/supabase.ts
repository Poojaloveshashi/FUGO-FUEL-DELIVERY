import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from './types';

// Hardcoded Supabase credentials as fallback strings (does not rely solely on import.meta.env)
export const DEFAULT_SUPABASE_PROJECT_ID = 'arierwpjaksxxnmvbqwn';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY = 'ap-southeast-1';

function resolveSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SUPABASE_URL;
  let clean = String(rawUrl).trim();
  if (
    !clean ||
    clean === 'YOUR_SUPABASE_URL' ||
    clean === 'MY_APP_URL' ||
    clean.includes('your-project-id')
  ) {
    return DEFAULT_SUPABASE_URL;
  }
  // Auto-prefix https:// if provided as bare project ID or domain without protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}.supabase.co`;
  }
  return clean.replace(/\/+$/, '');
}

function resolveSupabaseAnonKey(rawKey?: string): string {
  if (!rawKey) return DEFAULT_SUPABASE_ANON_KEY;
  const clean = String(rawKey).trim();
  if (!clean || clean === 'YOUR_SUPABASE_ANON_KEY') {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return clean;
}

const envProvidedUrl = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined;
const envProvidedKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined;

export const SUPABASE_URL = resolveSupabaseUrl(envProvidedUrl);
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey(envProvidedKey);
export const SUPABASE_PROJECT_ID = DEFAULT_SUPABASE_PROJECT_ID;

/**
 * Directly initialized Supabase client with safe fallback
 */
function createSafeClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  } catch (err) {
    console.warn('[Supabase] Failed to init with SUPABASE_URL, falling back to default:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
}

export const supabase: SupabaseClient = createSafeClient();

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

export {
  validateSupabaseAnonKey,
  isEligibleServiceType,
  normalizeSupabaseOrder,
  insertSupabaseOrder,
  fetchPendingOrdersFromSupabase,
  subscribeToSupabasePendingOrders,
  acceptSupabaseOrderToInTransit,
  completeSupabaseOrderWithOtp,
  subscribeToOrderRealtime,
  placeOrderWithRealtimeSubscription,
} from './lib/supabase';

export default supabase;
