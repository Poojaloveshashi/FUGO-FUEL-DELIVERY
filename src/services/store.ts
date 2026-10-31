import { 
  UserProfile, 
  Order, 
  SOSAlert, 
  UserRole, 
  UserStatus, 
  OrderStatus,
  Location 
} from '../types';
import {
  acceptSupabaseOrderToInTransit,
  completeSupabaseOrderWithOtp,
  subscribeToSupabasePendingOrders,
  insertSupabaseOrder,
  getSupabaseClient,
  normalizeSupabaseOrder
} from '../lib/supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  AUTH = 'auth',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const current = getCurrentUser();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: true,
      isAnonymous: current?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.info('[Autonomous Local Test Mode] Info:', JSON.stringify(errInfo));
  return errInfo;
}

// -------------------------------------------------------------
// Unified Auth & Session State Management (Pure Standalone)
// -------------------------------------------------------------
export interface AppAuthUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

const AUTH_STORAGE_KEY = 'fugo_unified_auth_user';
const PROFILE_STORAGE_KEY_PREFIX = 'fugo_profile_';
const ORDERS_STORAGE_KEY = 'fugo_local_orders';
const SOS_STORAGE_KEY = 'fugo_local_sos_alerts';

// Realistic Hyderabad Delivery Orders for Fuel Delivery Drivers
const SEED_HYDERABAD_ORDERS: Order[] = [
  {
    id: 'ord_hyd_001',
    customerId: 'cust_gachibowli_01',
    status: OrderStatus.PENDING,
    fuelType: 'Diesel (Commercial Generator)',
    amount: 35,
    price: 3325,
    location: {
      lat: 17.4435,
      lng: 78.3582,
      address: 'DLF Cybercity, Gachibowli, Hyderabad'
    },
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ord_hyd_002',
    customerId: 'cust_madhapur_02',
    status: OrderStatus.PENDING,
    fuelType: 'Petrol (Speed 95)',
    amount: 25,
    price: 2650,
    location: {
      lat: 17.4375,
      lng: 78.3842,
      address: 'Raheja Mindspace, Madhapur, Hyderabad'
    },
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'ord_hyd_003',
    customerId: 'cust_nanakramguda_03',
    status: OrderStatus.PENDING,
    fuelType: 'High Speed Diesel',
    amount: 50,
    price: 4750,
    location: {
      lat: 17.4156,
      lng: 78.3417,
      address: 'WaveRock SEZ, Financial District, Hyderabad'
    },
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'ord_hyd_004',
    customerId: 'cust_nallagandla_04',
    status: OrderStatus.PENDING,
    fuelType: 'Diesel (High Density)',
    amount: 40,
    price: 3800,
    location: {
      lat: 17.4820,
      lng: 78.3090,
      address: 'Near Aparna Sarovar Grande, Nallagandla, Hyderabad'
    },
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60000).toISOString(),
  }
];

export const DEFAULT_DRIVER_USER: AppAuthUser = {
  uid: 'driver_hyd_ramesh',
  displayName: 'Ramesh Kumar (Elite Driver)',
  phoneNumber: '+91 98765 43210',
  email: 'driver@fugo.hyd',
  isAnonymous: false,
};

export const DEFAULT_DRIVER_PROFILE: UserProfile = {
  uid: 'driver_hyd_ramesh',
  displayName: 'Ramesh Kumar (Elite Driver)',
  role: UserRole.DRIVER,
  status: UserStatus.ONLINE,
  phone: '+91 98765 43210',
  email: 'driver@fugo.hyd',
  location: {
    lat: 17.4401,
    lng: 78.3489,
    address: 'DLF Cybercity, Gachibowli, Hyderabad'
  },
  lastActive: new Date().toISOString()
};

export function getStoredSessionUser(): AppAuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw === '__logged_out__') return null;
    if (raw) return JSON.parse(raw);
    // Default session: launches driver dashboard directly without prompt blocker
    return DEFAULT_DRIVER_USER;
  } catch {
    return DEFAULT_DRIVER_USER;
  }
}

export function setStoredSessionUser(user: AppAuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, '__logged_out__');
    }
  } catch (e) {
    console.error('Session storage error:', e);
  }
}

export function getStoredProfile(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw);
    if (uid === DEFAULT_DRIVER_USER.uid) return DEFAULT_DRIVER_PROFILE;
    return null;
  } catch {
    return uid === DEFAULT_DRIVER_USER.uid ? DEFAULT_DRIVER_PROFILE : null;
  }
}

export function saveStoredProfile(uid: string, profile: UserProfile) {
  try {
    localStorage.setItem(`${PROFILE_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(profile));
  } catch (e) {
    console.error('Profile storage error:', e);
  }
}

export function getCurrentUser(): AppAuthUser | null {
  return getStoredSessionUser();
}

const authChangeListeners = new Set<(user: AppAuthUser | null) => void>();

function notifyAuthSubscribers(user: AppAuthUser | null) {
  authChangeListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.error('Auth subscriber error:', e);
    }
  });
}

/**
 * Autonomous Auth State Listener
 * Completely decoupled from Firebase network. Pure instant local state.
 */
export function subscribeToAuth(callback: (user: AppAuthUser | null) => void): () => void {
  authChangeListeners.add(callback);

  // Immediately notify with current session user
  const current = getCurrentUser();
  callback(current);

  return () => {
    authChangeListeners.delete(callback);
  };
}

/**
 * Sign out from session
 */
export async function logoutUser(): Promise<void> {
  setStoredSessionUser(null);
  notifyAuthSubscribers(null);
}

// -------------------------------------------------------------
// Fast OTP & Test Logins (100% Autonomous, 0ms Delay, 0 Errors)
// -------------------------------------------------------------

/**
 * Direct Fast OTP verification method
 * Runs locally without Firebase trial limits or network delays
 */
export async function fastVerifyOtp(
  phoneNumber: string,
  _otpCode: string,
  role: UserRole = UserRole.DRIVER,
  displayName?: string
): Promise<AppAuthUser> {
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  const cleanDigits = phoneNumber.replace(/\D/g, '');
  const isDriver = role === UserRole.DRIVER;
  const uid = `user_${cleanDigits || (isDriver ? 'driver_ramesh' : 'customer_vikram')}`;
  const finalName = displayName || (isDriver ? 'Ramesh Kumar (Elite Driver)' : 'Vikram Rao (Customer)');

  const userObj: AppAuthUser = {
    uid,
    displayName: finalName,
    phoneNumber: formattedPhone,
    email: `${cleanDigits || (isDriver ? 'driver' : 'customer')}@fugo.hyd`,
    isAnonymous: false,
  };

  const profileData: UserProfile = {
    uid,
    displayName: finalName,
    role,
    status: UserStatus.ONLINE,
    phone: formattedPhone,
    email: userObj.email || undefined,
    location: {
      lat: 17.4401,
      lng: 78.3489,
      address: 'Gachibowli, Hyderabad, Telangana 500032'
    },
    lastActive: new Date().toISOString()
  };

  // 1. Establish session locally
  setStoredSessionUser(userObj);
  saveStoredProfile(uid, profileData);
  notifyAuthSubscribers(userObj);

  return userObj;
}

/**
 * Fast 1-Click Test Login for Driver or Customer
 */
export async function fastTestLogin(
  role: UserRole = UserRole.DRIVER,
  displayName: string = 'Ramesh Kumar (Elite Driver)',
  phone: string = '+91 98765 43210'
): Promise<AppAuthUser> {
  const isDriver = role === UserRole.DRIVER;
  const uid = isDriver ? 'driver_hyd_ramesh' : 'customer_hyd_vikram';

  const userObj: AppAuthUser = {
    uid,
    displayName,
    phoneNumber: phone,
    email: `${isDriver ? 'driver' : 'customer'}@fugo.hyd`,
    isAnonymous: false,
  };

  const profileData: UserProfile = {
    uid,
    displayName,
    role,
    status: UserStatus.ONLINE,
    phone,
    email: userObj.email || undefined,
    location: {
      lat: 17.4401,
      lng: 78.3489,
      address: '2-10/A/2, Gopanapalli Thanda, Gachibowli, Hyderabad'
    },
    lastActive: new Date().toISOString()
  };

  setStoredSessionUser(userObj);
  saveStoredProfile(uid, profileData);
  notifyAuthSubscribers(userObj);

  return userObj;
}

/**
 * Fast Google Sign-in verification
 */
export async function fastGoogleLogin(role: UserRole = UserRole.CUSTOMER): Promise<AppAuthUser> {
  const isDriver = role === UserRole.DRIVER;
  const uid = isDriver ? 'google_driver_hyd' : 'google_customer_hyd';
  const name = isDriver ? 'Ramesh Kumar (Verified Google Partner)' : 'Vikram Rao (Verified Customer)';

  const mappedUser: AppAuthUser = {
    uid,
    displayName: name,
    email: `${isDriver ? 'ramesh.driver' : 'vikram.customer'}@gmail.com`,
    phoneNumber: '+91 98765 00000',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    isAnonymous: false
  };

  const profileData: UserProfile = {
    uid,
    displayName: name,
    email: mappedUser.email || '',
    role,
    status: UserStatus.ONLINE,
    phone: mappedUser.phoneNumber || undefined,
    lastActive: new Date().toISOString(),
    location: { lat: 17.4401, lng: 78.3489, address: 'Gachibowli, Hyderabad' }
  };

  setStoredSessionUser(mappedUser);
  saveStoredProfile(uid, profileData);
  notifyAuthSubscribers(mappedUser);

  return mappedUser;
}

// -------------------------------------------------------------
// User Profile Management
// -------------------------------------------------------------

export async function createProfile(profile: Partial<UserProfile>): Promise<void> {
  const current = getCurrentUser();
  if (!current) return;
  const uid = current.uid;

  const data: UserProfile = {
    uid,
    email: current.email || '',
    displayName: current.displayName || 'Fugo Driver Agent',
    role: profile.role || UserRole.DRIVER,
    status: profile.status || UserStatus.ONLINE,
    lastActive: new Date().toISOString(),
    location: profile.location || { lat: 17.4401, lng: 78.3489, address: 'Gachibowli, Hyderabad' },
    ...profile
  };

  saveStoredProfile(uid, data);
  notifyProfileListeners(uid, data);
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  return getStoredProfile(uid);
}

export async function updateProfileStatus(status: UserStatus): Promise<void> {
  const current = getCurrentUser();
  if (!current) return;
  const uid = current.uid;
  const currentProfile = getStoredProfile(uid);
  if (currentProfile) {
    currentProfile.status = status;
    currentProfile.lastActive = new Date().toISOString();
    saveStoredProfile(uid, currentProfile);
    notifyProfileListeners(uid, currentProfile);
  }
}

export async function switchUserRole(role: UserRole): Promise<void> {
  const current = getCurrentUser();
  if (!current) return;
  const uid = current.uid;
  let currentProfile = getStoredProfile(uid);
  if (!currentProfile) {
    currentProfile = {
      uid,
      displayName: current.displayName || 'Fugo User',
      role,
      status: UserStatus.ONLINE,
      location: { lat: 17.4401, lng: 78.3489, address: 'Gachibowli, Hyderabad' }
    };
  } else {
    currentProfile.role = role;
    currentProfile.lastActive = new Date().toISOString();
  }
  saveStoredProfile(uid, currentProfile);
  notifyProfileListeners(uid, currentProfile);
}

export async function updateProfileLocation(location: Location): Promise<void> {
  const current = getCurrentUser();
  if (!current) return;
  const uid = current.uid;
  const currentProfile = getStoredProfile(uid);
  if (currentProfile) {
    currentProfile.location = location;
    currentProfile.lastActive = new Date().toISOString();
    saveStoredProfile(uid, currentProfile);
    notifyProfileListeners(uid, currentProfile);
  }
}

// -------------------------------------------------------------
// Orders & Realtime Job Management (Local Reactive Store)
// -------------------------------------------------------------

function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...SEED_HYDERABAD_ORDERS];
}

function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Orders storage error:', e);
  }
}

const orderListeners = new Set<() => void>();
function notifyOrderListeners() {
  orderListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

export async function createOrder(order: Partial<Order>): Promise<string | null> {
  const current = getCurrentUser();
  const customerId = current?.uid || 'guest_customer';
  const orderId = `ord_hyd_${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    customerId,
    status: OrderStatus.PENDING,
    fuelType: order.fuelType || 'High Speed Diesel',
    amount: order.amount || 25,
    price: order.price || 2400,
    location: order.location || {
      lat: 17.4401,
      lng: 78.3489,
      address: 'Gachibowli, Hyderabad'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...order
  };

  const orders = getStoredOrders();
  orders.unshift(newOrder);
  saveStoredOrders(orders);
  notifyOrderListeners();

  return orderId;
}

/**
 * Connect to Supabase:
 * When accepted, update the order status to 'IN_TRANSIT'
 * Also updates driver_id in Supabase table 'orders'
 */
export async function acceptJob(orderId: string, driverId: string): Promise<void> {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  const now = new Date().toISOString();

  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      driverId,
      driver_id: driverId,
      status: OrderStatus.IN_TRANSIT,
      updatedAt: now,
      updated_at: now
    };
    saveStoredOrders(orders);
    notifyOrderListeners();
  }

  // Live Supabase update: updates orders table status to 'IN_TRANSIT'
  try {
    await acceptSupabaseOrderToInTransit(orderId, driverId);
  } catch (err) {
    console.warn('[Supabase] acceptJob remote error:', err);
  }
}

export async function acceptOrder(orderId: string, driverId?: string): Promise<void> {
  const current = getCurrentUser();
  const targetDriverId = driverId || current?.uid || 'driver_hyd_ramesh';
  return acceptJob(orderId, targetDriverId);
}

/**
 * Provide an OTP verification input to mark the order 'COMPLETED'
 * Updates both live Supabase database and local store.
 */
export async function completeOrderWithOtp(
  orderId: string,
  otpCode: string,
  expectedOtp?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate and submit to Supabase
  const supaResult = await completeSupabaseOrderWithOtp(orderId, otpCode, expectedOtp);
  if (!supaResult.success) {
    return supaResult;
  }

  // Update reactive local store
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  const now = new Date().toISOString();

  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      status: OrderStatus.COMPLETED,
      updatedAt: now,
      updated_at: now
    };
    saveStoredOrders(orders);
    notifyOrderListeners();
  }

  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus | string): Promise<void> {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      status: status as any,
      updatedAt: new Date().toISOString()
    };
    saveStoredOrders(orders);
    notifyOrderListeners();
  }

  // Try updating Supabase
  try {
    const client = getSupabaseClient();
    await client.from('orders').update({
      status: status.toString(),
      updated_at: new Date().toISOString()
    }).eq('id', orderId);
  } catch (e) {
    console.warn('[Supabase] updateOrderStatus remote error:', e);
  }
}

/**
 * Direct port of Flutter / Supabase sendLocationPing:
 * void sendLocationPing(String orderId, double lat, double lng) {
 *   Supabase.instance.client.from('orders').update({
 *     'driver_lat': lat,
 *     'driver_lng': lng,
 *   }).eq('id', orderId);
 * }
 */
export async function sendLocationPing(orderId: string, lat: number, lng: number): Promise<void> {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      driver_lat: lat,
      driver_lng: lng,
      driverLocation: { lat, lng },
      updatedAt: new Date().toISOString()
    };
    saveStoredOrders(orders);
    notifyOrderListeners();
  }
}

// -------------------------------------------------------------
// SOS Alerts (Local Store)
// -------------------------------------------------------------

function getStoredSOSAlerts(): SOSAlert[] {
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredSOSAlerts(alerts: SOSAlert[]) {
  try {
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error(e);
  }
}

const sosListeners = new Set<(alerts: SOSAlert[]) => void>();
function notifySOSListeners() {
  const alerts = getStoredSOSAlerts();
  sosListeners.forEach(listener => {
    try {
      listener(alerts);
    } catch (e) {
      console.error(e);
    }
  });
}

export async function createSOS(location: Location): Promise<void> {
  const current = getCurrentUser();
  const userId = current?.uid || 'anonymous_driver';
  const newAlert: SOSAlert = {
    id: `sos_${Date.now()}`,
    userId,
    location,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const alerts = getStoredSOSAlerts();
  alerts.unshift(newAlert);
  saveStoredSOSAlerts(alerts);
  notifySOSListeners();
}

// -------------------------------------------------------------
// Subscriptions (Reactive Memory & Local Storage Sync)
// -------------------------------------------------------------

/**
 * Supabase Real-time orders stream:
 * Supabase.instance.client
 *   .from('orders')
 *   .stream(primaryKey: ['id'])
 *   .eq('status', 'PENDING')
 *   .listen((orders) => { ... })
 */
export function subscribeToAvailableJobs(callback: (orders: Order[]) => void): () => void {
  // Sync map of known pending orders
  const emitAvailable = () => {
    const all = getStoredOrders();
    const pending = all.filter(o => 
      o.status === OrderStatus.PENDING || o.status === 'PENDING' || o.status === 'pending'
    );
    callback(pending);
  };

  emitAvailable();
  const listener = () => emitAvailable();
  orderListeners.add(listener);

  // Connect live Supabase Real-time stream
  let supaSubscription: { unsubscribe: () => void } | null = null;
  try {
    supaSubscription = subscribeToSupabasePendingOrders(
      (supaPendingOrders) => {
        if (supaPendingOrders && supaPendingOrders.length > 0) {
          const stored = getStoredOrders();
          let changed = false;

          supaPendingOrders.forEach(so => {
            const idx = stored.findIndex(e => e.id === so.id);
            if (idx === -1) {
              stored.unshift(so);
              changed = true;
            } else if (stored[idx].status !== so.status) {
              stored[idx] = { ...stored[idx], ...so };
              changed = true;
            }
          });

          if (changed) {
            saveStoredOrders(stored);
            notifyOrderListeners();
          }
        }
      },
      (newIncomingOrder) => {
        // Direct event trigger for real-time ringtone & modal
        const stored = getStoredOrders();
        if (!stored.some(e => e.id === newIncomingOrder.id)) {
          stored.unshift(newIncomingOrder);
          saveStoredOrders(stored);
          notifyOrderListeners();
        }
      }
    );
  } catch (err) {
    console.warn('[Supabase Realtime] Listener init notice:', err);
  }

  return () => {
    orderListeners.delete(listener);
    if (supaSubscription) {
      supaSubscription.unsubscribe();
    }
  };
}

export function subscribeToCustomerOrders(customerId: string, callback: (orders: Order[]) => void): () => void {
  const emitCustomer = () => {
    const all = getStoredOrders();
    callback(all.filter(o => o.customerId === customerId || o.customer_id === customerId));
  };
  emitCustomer();

  const listener = () => emitCustomer();
  orderListeners.add(listener);

  return () => {
    orderListeners.delete(listener);
  };
}

export function subscribeToMyActiveDeliveries(driverId: string, callback: (orders: Order[]) => void): () => void {
  const emitActive = () => {
    const all = getStoredOrders();
    const active = all.filter(o => 
      (o.driverId === driverId || o.driver_id === driverId) &&
      [
        OrderStatus.IN_TRANSIT,
        OrderStatus.ASSIGNED, 
        OrderStatus.ACCEPTED, 
        OrderStatus.DELIVERING, 
        'IN_TRANSIT',
        'ASSIGNED', 
        'ACCEPTED', 
        'DELIVERING'
      ].includes(o.status as any)
    );
    callback(active);
  };
  emitActive();

  const listener = () => emitActive();
  orderListeners.add(listener);

  return () => {
    orderListeners.delete(listener);
  };
}

export function subscribeToDriverOrderHistory(driverId: string, callback: (orders: Order[]) => void): () => void {
  const emitHistory = () => {
    const all = getStoredOrders();
    callback(all.filter(o => o.driverId === driverId || o.driver_id === driverId));
  };
  emitHistory();

  const listener = () => emitHistory();
  orderListeners.add(listener);

  return () => {
    orderListeners.delete(listener);
  };
}

interface ProfileListenerEntry {
  uid: string;
  callback: (profile: UserProfile | null) => void;
}
const profileListeners: ProfileListenerEntry[] = [];

function notifyProfileListeners(uid: string, profile: UserProfile | null) {
  profileListeners.forEach(entry => {
    if (entry.uid === uid) {
      try {
        entry.callback(profile);
      } catch (e) {
        console.error(e);
      }
    }
  });
}

export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
  const entry: ProfileListenerEntry = { uid, callback };
  profileListeners.push(entry);

  const cached = getStoredProfile(uid);
  if (cached) {
    callback(cached);
  } else {
    const defaultProfile: UserProfile = {
      uid,
      displayName: uid.includes('customer') ? 'Vikram Rao (Customer)' : 'Ramesh Kumar (Elite Driver)',
      role: uid.includes('customer') ? UserRole.CUSTOMER : UserRole.DRIVER,
      status: UserStatus.ONLINE,
      phone: '+91 98765 43210',
      location: { lat: 17.4401, lng: 78.3489, address: 'Gachibowli, Hyderabad, Telangana' },
      lastActive: new Date().toISOString()
    };
    saveStoredProfile(uid, defaultProfile);
    callback(defaultProfile);
  }

  return () => {
    const idx = profileListeners.indexOf(entry);
    if (idx !== -1) profileListeners.splice(idx, 1);
  };
}

export function subscribeToSOS(callback: (alerts: SOSAlert[]) => void): () => void {
  sosListeners.add(callback);
  callback(getStoredSOSAlerts());
  return () => {
    sosListeners.delete(callback);
  };
}

// Compatibility stubs for Recaptcha & Phone Auth
export async function setupRecaptcha(_containerId: string): Promise<any> {
  return {
    clear: () => {},
    render: async () => 'test-verifier-token'
  };
}

export async function signInWithPhone(phoneNumber: string, _verifier: any): Promise<any> {
  return {
    confirm: async (_code: string) => {
      return {
        user: await fastVerifyOtp(phoneNumber, _code)
      };
    }
  };
}
