import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult 
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { 
  UserProfile, 
  Order, 
  SOSAlert, 
  UserRole, 
  UserStatus, 
  OrderStatus,
  Location 
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  AUTH = 'auth',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth
export async function setupRecaptcha(containerId: string) {
  try {
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {}
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.AUTH, 'recaptcha');
    return null;
  }
}

export async function signInWithPhone(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult | null> {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    handleFirestoreError(error, OperationType.AUTH, 'phone_auth_request');
    return null;
  }
}

// User Profile
export async function createProfile(profile: Partial<UserProfile>) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    const data = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || '',
      role: profile.role || UserRole.CUSTOMER,
      status: UserStatus.OFFLINE,
      lastActive: serverTimestamp(),
      ...profile
    };
    await setDoc(doc(db, 'users', auth.currentUser.uid), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function updateProfileStatus(status: UserStatus) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      status,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateProfileLocation(location: Location) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      location,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Orders
export async function createOrder(order: Partial<Order>): Promise<string | null> {
  if (!auth.currentUser) return null;
  const path = 'orders';
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      customerId: auth.currentUser.uid,
      status: OrderStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return null;
  }
}

export async function acceptOrder(orderId: string) {
  if (!auth.currentUser) return;
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      driverId: auth.currentUser.uid,
      status: OrderStatus.ACCEPTED,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// SOS
export async function createSOS(location: Location) {
  if (!auth.currentUser) return;
  const path = 'sos_alerts';
  try {
    await addDoc(collection(db, 'sos_alerts'), {
      userId: auth.currentUser.uid,
      location,
      status: 'active',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Listeners
export function subscribeToAvailableJobs(callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('status', '==', OrderStatus.PENDING));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders/pending'));
}

export function subscribeToCustomerOrders(customerId: string, callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `orders/customer/${customerId}`));
}

export function subscribeToMyActiveDeliveries(driverId: string, callback: (orders: Order[]) => void) {
  const q = query(
    collection(db, 'orders'), 
    where('driverId', '==', driverId),
    where('status', 'in', [OrderStatus.ACCEPTED, OrderStatus.DELIVERING])
  );
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `orders/driver/${driverId}/active`));
}

export function subscribeToDriverOrderHistory(driverId: string, callback: (orders: Order[]) => void) {
  const q = query(
    collection(db, 'orders'), 
    where('driverId', '==', driverId)
  );
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `orders/driver/${driverId}/history`));
}

export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`));
}

export function subscribeToSOS(callback: (alerts: SOSAlert[]) => void) {
  const q = query(collection(db, 'sos_alerts'), where('status', '==', 'active'));
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() } as SOSAlert));
    callback(alerts);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'sos_alerts'));
}
