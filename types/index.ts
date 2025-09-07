export interface User {
  id: string;
  email: string;
  role: 'broker' | 'driver';
  companyName?: string;
  name?: string;
  phone?: string;
  driverId?: string;
  licenseNumber?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  driverId: string;
  status: 'active' | 'inactive' | 'on_journey';
  currentLocation?: string;
  brokerId: string;
  createdAt: string;
}

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
}

export interface LocationUpdate {
  journeyId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export interface NotificationData {
  type: 'journey_started' | 'milestone_reached' | 'journey_completed';
  message: string;
  journeyId?: string;
  driverName?: string;
  milestone?: string;
  location?: any;
}