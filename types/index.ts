// API Types matching Cargo360 API contracts
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'trucker' | 'admin' | 'driver';
  isApproved: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shipment {
  id: number;
  customerId: number;
  truckerId?: number;
  driverId?: number;
  pickupLocation: string;
  dropLocation: string;
  cargoType: string;
  description: string;
  vehicleType: 'truck' | 'van' | 'pickup' | 'trailer' | 'container';
  cargoWeight?: number;
  cargoSize?: string;
  budget?: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  Customer?: User;
  Trucker?: User;
  Driver?: User;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

// Legacy types for backward compatibility
export interface Journey {
  id: string;
  clientId: string;
  driverId?: string;
  driverName?: string;
  vehicleType: string;
  loadType: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  budget?: number;
  cargoWeight?: number;
  cargoSize?: string;
  description?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  driverId?: string;
  status: 'active' | 'inactive' | 'on_journey';
  currentLocation?: string;
  brokerId: string;
  createdAt: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  hasSignedUp: boolean;
}

// Form data types
export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'trucker' | 'driver';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ShipmentCreateData {
  pickupLocation: string;
  dropLocation: string;
  cargoType: string;
  description: string;
  vehicleType: 'truck' | 'van' | 'pickup' | 'trailer' | 'container';
  cargoWeight?: number;
  cargoSize?: string;
  budget?: number;
}

// Error handling types
export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Location tracking types
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface TrackingUpdate {
  shipmentId: number;
  location: LocationData;
  status?: string;
  notes?: string;
}

// Notification types
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  data?: any;
}

// Filter and search types
export interface ShipmentFilters {
  status?: string;
  vehicleType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserFilters {
  role?: string;
  isApproved?: boolean;
  isEmailVerified?: boolean;
}