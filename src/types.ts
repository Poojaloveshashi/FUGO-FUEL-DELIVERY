export enum UserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  SUPPORT = 'support',
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  location?: Location;
  lastActive?: any;
  phone?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customer_id?: string;
  driverId?: string;
  driver_id?: string;
  driver_lat?: number;
  driver_lng?: number;
  driverLocation?: { lat: number; lng: number };
  status: OrderStatus | string;
  service_type?: 'FUEL' | 'TRANSPORT' | 'MAINTENANCE' | string;
  serviceType?: 'FUEL' | 'TRANSPORT' | 'MAINTENANCE' | string;
  job_kind?: 'VEHICLE_PICKUP' | 'VEHICLE_RETURN' | string;
  jobKind?: 'VEHICLE_PICKUP' | 'VEHICLE_RETURN' | string;
  fuelType?: string;
  fuel_type?: string;
  amount?: number;
  location: Location;
  price: number;
  otp?: string;
  delivery_otp?: string;
  source_app?: string;
  sourceAppUrl?: string;
  customer_name?: string;
  customer_phone?: string;
  createdAt?: any;
  created_at?: any;
  updatedAt?: any;
  updated_at?: any;
}

export interface SOSAlert {
  id: string;
  userId: string;
  location: Location;
  status: 'active' | 'resolved';
  createdAt: any;
}

export type FulfilmentCategory = 'DELIVERY' | 'MECHANICS' | 'OUTLETS' | 'WAREHOUSE' | 'ALL';
export type ClientAppType = 'FUEL_APP' | 'REPAIRS_APP' | 'SERVICE_APP';

export interface WarehouseStockItem {
  id: string;
  name: string;
  category: 'fuel' | 'parts';
  quantity: number;
  unit: string;
  minThreshold: number;
}

export interface OfflineOutlet {
  id: string;
  name: string;
  type: 'pump' | 'garage' | 'hub';
  address: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  fuelAvailable: boolean;
}
