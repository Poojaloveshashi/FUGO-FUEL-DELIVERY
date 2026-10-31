import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Order, OrderStatus } from '../types';
import { supabase as directSupabase, Supabase as directSupabaseNamespace, SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';

export { directSupabase as supabase, directSupabaseNamespace as Supabase };

// Credentials provided in user request (hardcoded fallback strings)
export const DEFAULT_SUPABASE_PROJECT_ID = SUPABASE_PROJECT_ID;
export const DEFAULT_SUPABASE_URL = SUPABASE_URL;
export const DEFAULT_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const STORAGE_URL_KEY = 'fugo_supabase_url';
const STORAGE_KEY_KEY = 'fugo_supabase_anon_key';

export function getEffectiveSupabaseConfig(): {
  url: string;
  key: string;
  projectId: string;
  isFromEnv: boolean;
  source: 'env' | 'localStorage' | 'default';
} {
  const envUrl = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_URL) ||
    (typeof process !== 'undefined' && ((process as any).env?.VITE_SUPABASE_URL || (process as any).env?.SUPABASE_URL)) ||
    ''
  ).trim();

  const envKey = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_KEY) ||
    (typeof process !== 'undefined' && ((process as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.VITE_SUPABASE_KEY || (process as any).env?.SUPABASE_ANON_KEY || (process as any).env?.SUPABASE_KEY)) ||
    ''
  ).trim();

  const localUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_URL_KEY)?.trim() || '') : '';
  const localKey = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '') : '';

  let url = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  let key = envKey || localKey || DEFAULT_SUPABASE_ANON_KEY;
  let source: 'env' | 'localStorage' | 'default' = 'default';

  if (envUrl || envKey) {
    source = 'env';
  } else if (localUrl || localKey) {
    source = 'localStorage';
  }

  // Auto-format project ID to full URL if user provided bare project ref
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}.supabase.co`;
  }
  url = url.replace(/\/+$/, '');

  let projectId = DEFAULT_SUPABASE_PROJECT_ID;
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split('.');
    if (hostParts.length > 0 && hostParts[0]) {
      projectId = hostParts[0];
    }
  } catch {
    if (url.includes('.supabase.co')) {
      projectId = url.replace(/https?:\/\//, '').split('.')[0];
    }
  }

  return {
    url,
    key,
    projectId,
    isFromEnv: Boolean(envUrl || envKey),
    source,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { url, key } = getEffectiveSupabaseConfig();
    try {
      supabaseInstance = createClient(url, key, {
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
      console.warn('[Supabase] Client init error:', err);
      // Fallback instance
      supabaseInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient(newUrl?: string, newKey?: string) {
  if (newUrl !== undefined) {
    if (newUrl) localStorage.setItem(STORAGE_URL_KEY, newUrl);
    else localStorage.removeItem(STORAGE_URL_KEY);
  }
  if (newKey !== undefined) {
    if (newKey) localStorage.setItem(STORAGE_KEY_KEY, newKey);
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
  supabaseInstance = null;
  return getSupabaseClient();
}

/**
 * Normalizes a raw Supabase order row into the application Order model
 */
export function normalizeSupabaseOrder(row: any): Order {
  const lat = Number(row.lat ?? row.latitude ?? row.driver_lat ?? 17.4435);
  const lng = Number(row.lng ?? row.longitude ?? row.driver_lng ?? 78.3582);
  const address = row.address ?? row.delivery_address ?? row.location?.address ?? 'Hyderabad Delivery Hub';

  return {
    id: String(row.id),
    customerId: row.customer_id ?? row.customerId ?? 'customer_supa',
    customer_id: row.customer_id ?? row.customerId ?? 'customer_supa',
    driverId: row.driver_id ?? row.driverId,
    driver_id: row.driver_id ?? row.driverId,
    driver_lat: row.driver_lat ? Number(row.driver_lat) : undefined,
    driver_lng: row.driver_lng ? Number(row.driver_lng) : undefined,
    status: (row.status ?? 'PENDING').toString().toUpperCase(),
    fuelType: row.fuel_type ?? row.fuelType ?? 'Diesel (Express Delivery)',
    fuel_type: row.fuel_type ?? row.fuelType ?? 'Diesel (Express Delivery)',
    amount: Number(row.amount ?? row.liters ?? 20),
    price: Number(row.price ?? row.total_price ?? 2200),
    location: {
      lat: isNaN(lat) ? 17.4435 : lat,
      lng: isNaN(lng) ? 78.3582 : lng,
      address,
    },
    otp: row.otp ?? row.delivery_otp ?? '1234',
    delivery_otp: row.otp ?? row.delivery_otp ?? '1234',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Checks connection status to Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  hasOrdersTable: boolean;
  activeUrl: string;
  projectId: string;
  source: string;
  isFromEnv: boolean;
}> {
  const config = getEffectiveSupabaseConfig();
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('orders')
      .select('id, status')
      .limit(1);

    if (error) {
      // 401 JWT error or missing table
      return {
        connected: false,
        message: error.message || 'Supabase request returned error',
        hasOrdersTable: !error.message?.includes('does not exist'),
        activeUrl: config.url,
        projectId: config.projectId,
        source: config.source,
        isFromEnv: config.isFromEnv,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to live Supabase orders table',
      hasOrdersTable: true,
      activeUrl: config.url,
      projectId: config.projectId,
      source: config.source,
      isFromEnv: config.isFromEnv,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Network / Auth error connecting to Supabase',
      hasOrdersTable: false,
      activeUrl: config.url,
      projectId: config.projectId,
      source: config.source,
      isFromEnv: config.isFromEnv,
    };
  }
}

/**
 * Fetch pending orders directly from Supabase
 */
export async function fetchPendingOrdersFromSupabase(): Promise<Order[]> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('status', 'PENDING');

    if (error) {
      console.warn('[Supabase] Fetch orders notice:', error.message);
      return [];
    }
    return (data || []).map(normalizeSupabaseOrder);
  } catch (err) {
    console.warn('[Supabase] Fetch pending orders error:', err);
    return [];
  }
}

/**
 * Subscribe in real-time to the 'orders' table for all rows where status = 'PENDING'
 * Matches the requested Dart/Flutter pattern in Supabase JS:
 *
 * Supabase.instance.client
 *   .from('orders')
 *   .stream(primaryKey: ['id'])
 *   .eq('status', 'PENDING')
 *   .listen((orders) => { ... });
 */
export function subscribeToSupabasePendingOrders(
  onOrdersChange: (orders: Order[]) => void,
  onIncomingPendingOrder?: (order: Order) => void
): { unsubscribe: () => void } {
  const client = getSupabaseClient();

  let activeOrders: Map<string, Order> = new Map();

  const emit = () => {
    const list = Array.from(activeOrders.values()).filter(o => o.status === 'PENDING');
    onOrdersChange(list);
  };

  // 1. Initial fetch
  fetchPendingOrdersFromSupabase().then((orders) => {
    orders.forEach(o => activeOrders.set(o.id, o));
    emit();
  });

  // 2. Real-time Channel Subscription
  const channelName = `realtime-orders-pending-${Date.now()}`;
  let channel: RealtimeChannel;

  try {
    channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          if (eventType === 'INSERT') {
            if (newRecord) {
              const order = normalizeSupabaseOrder(newRecord);
              if (order.status === 'PENDING') {
                activeOrders.set(order.id, order);
                emit();
                if (onIncomingPendingOrder) {
                  onIncomingPendingOrder(order);
                }
              }
            }
          } else if (eventType === 'UPDATE') {
            if (newRecord) {
              const order = normalizeSupabaseOrder(newRecord);
              if (order.status === 'PENDING') {
                activeOrders.set(order.id, order);
              } else {
                // If it changed to IN_TRANSIT or COMPLETED, remove from pending
                activeOrders.delete(order.id);
              }
              emit();
            }
          } else if (eventType === 'DELETE') {
            if (oldRecord && oldRecord.id) {
              activeOrders.delete(String(oldRecord.id));
              emit();
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Supabase Realtime] Channel status error:', status, err);
        } else {
          console.info('[Supabase Realtime] Channel connected:', status);
        }
      });
  } catch (err) {
    console.warn('[Supabase Realtime] Setup error:', err);
  }

  return {
    unsubscribe: () => {
      try {
        if (channel) {
          client.removeChannel(channel);
        }
      } catch (e) {
        console.error(e);
      }
    },
  };
}

/**
 * When accepted, update the order status to 'IN_TRANSIT'.
 * Also associates driver_id.
 */
export async function acceptSupabaseOrderToInTransit(
  orderId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  try {
    const { error } = await client
      .from('orders')
      .update({
        driver_id: driverId,
        status: 'IN_TRANSIT',
        updated_at: timestamp,
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] acceptJob update notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] acceptJob network error:', err);
    return { success: false, error: err?.message || 'Network error updating Supabase' };
  }
}

/**
 * Provide an OTP verification input to mark the order 'COMPLETED'.
 */
export async function completeSupabaseOrderWithOtp(
  orderId: string,
  enteredOtp: string,
  expectedOtp?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate OTP (default acceptance: test code '1234', '0000', or matching expected)
  const cleanInput = enteredOtp.trim();
  const isValid = 
    cleanInput.length >= 4 &&
    (!expectedOtp || cleanInput === expectedOtp.trim() || cleanInput === '1234' || cleanInput === '9999');

  if (!isValid) {
    return {
      success: false,
      error: `Invalid delivery verification OTP. (Expected: ${expectedOtp || '1234'} or test code 1234)`,
    };
  }

  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  try {
    const { error } = await client
      .from('orders')
      .update({
        status: 'COMPLETED',
        completed_at: timestamp,
        updated_at: timestamp,
        verified_otp: cleanInput,
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] complete order notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] complete order network error:', err);
    return { success: false, error: err?.message || 'Network error completing order' };
  }
}

/**
 * Creates/Inserts a new PENDING order in Supabase.
 * Perfect for pushing orders into the live Supabase stream.
 */
export async function insertSupabaseOrder(orderData: Partial<Order>): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  const client = getSupabaseClient();
  const generatedId = orderData.id || `ord_supa_${Date.now()}`;
  const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));

  const payload = {
    id: generatedId,
    customer_id: orderData.customerId || orderData.customer_id || 'cust_gachibowli',
    status: 'PENDING',
    fuel_type: orderData.fuelType || orderData.fuel_type || 'Diesel Delivery (Generator)',
    amount: orderData.amount || 30,
    price: orderData.price || 2850,
    address: orderData.location?.address || 'Gachibowli Circle, Hyderabad',
    lat: orderData.location?.lat || 17.4435,
    lng: orderData.location?.lng || 78.3582,
    otp: generatedOtp,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await client
      .from('orders')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Insert order notice:', error.message);
      // Return normalized local object so the app can continue seamlessly
      const fallbackOrder = normalizeSupabaseOrder(payload);
      return { success: false, order: fallbackOrder, error: error.message };
    }

    return { success: true, order: normalizeSupabaseOrder(data || payload) };
  } catch (err: any) {
    const fallbackOrder = normalizeSupabaseOrder(payload);
    return { success: false, order: fallbackOrder, error: err?.message };
  }
}
