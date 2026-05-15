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
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
  customerId: string;
  driverId?: string;
  status: OrderStatus;
  fuelType: string;
  amount: number;
  location: Location;
  price: number;
  createdAt: any;
  updatedAt: any;
}

export interface SOSAlert {
  id: string;
  userId: string;
  location: Location;
  status: 'active' | 'resolved';
  createdAt: any;
}
