import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://cargo360-api.onrender.com';

// Types based on API contracts
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

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
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

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store tokens
    await AsyncStorage.setItem('accessToken', response.accessToken);
    await AsyncStorage.setItem('refreshToken', response.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  // convenience helper: phone login (phone in "email" field per API spec)
  async loginWithPhone(phone: string, password: string): Promise<LoginResponse> {
    return this.login(phone, password);
  }

  async signup(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'trucker' | 'admin' | 'driver' | 'moderator';
  }): Promise<{ message: string; user: User }> {
    return this.makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<{ user: User }> {
    return this.makeRequest('/auth/me');
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.makeRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update stored tokens
    await AsyncStorage.setItem('accessToken', response.accessToken);
    await AsyncStorage.setItem('refreshToken', response.refreshToken);

    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  // Shipment endpoints
  async createShipment(shipmentData: {
    pickupLocation: string;
    dropLocation: string;
    cargoType: string;
    description: string;
    vehicleType: 'truck' | 'van' | 'pickup' | 'trailer' | 'container';
    cargoWeight?: number;
    cargoSize?: string;
    budget?: number;
  }): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async getMyShipments(status?: string): Promise<ApiResponse<{ shipments: Shipment[] }>> {
    const queryParams = status ? `?status=${status}` : '';
    return this.makeRequest(`/shipments/mine${queryParams}`);
  }

  async getAvailableShipments(vehicleType?: string): Promise<ApiResponse<{ shipments: Shipment[] }>> {
    const queryParams = vehicleType ? `?vehicleType=${vehicleType}` : '';
    return this.makeRequest(`/shipments/available${queryParams}`);
  }

  async getTruckerShipments(status?: string): Promise<ApiResponse<{ shipments: Shipment[] }>> {
    const queryParams = status ? `?status=${status}` : '';
    return this.makeRequest(`/shipments/mine-trucker${queryParams}`);
  }

  async getDriverShipments(status?: string): Promise<ApiResponse<{ shipments: Shipment[] }>> {
    const queryParams = status ? `?status=${status}` : '';
    return this.makeRequest(`/shipments/mine-driver${queryParams}`);
  }

  async acceptShipment(shipmentId: number): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}/accept`, {
      method: 'POST',
    });
  }

  async updateShipmentStatus(
    shipmentId: number,
    status: 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateDriverShipmentStatus(
    shipmentId: number,
    status: 'picked_up' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}/status-driver`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getShipment(shipmentId: number): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}`);
  }

  async updateShipment(
    shipmentId: number,
    updates: Partial<{
      pickupLocation: string;
      dropLocation: string;
      cargoType: string;
      description: string;
      vehicleType: string;
      cargoWeight: number;
      cargoSize: string;
      budget: number;
    }>
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async cancelShipment(shipmentId: number): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}/cancel`, {
      method: 'PATCH',
    });
  }

  async trackShipmentLocation(
    shipmentId: number,
    locationData: {
      latitude: number;
      longitude: number;
      accuracy: number;
      speed?: number;
      heading?: number;
      timestamp: string;
    }
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/location/shipments/${shipmentId}/track`, {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  // Admin endpoints
  async getAllUsers(): Promise<{ users: User[] }> {
    return this.makeRequest('/admin/users');
  }

  async approveUser(userId: number): Promise<{ user: User }> {
    return this.makeRequest(`/admin/users/${userId}/approve`, {
      method: 'PATCH',
    });
  }

  async getAllShipments(): Promise<{ shipments: Shipment[] }> {
    return this.makeRequest('/admin/shipments');
  }

  async assignShipment(
    shipmentId: number,
    assignment: 'trucker' | 'driver',
    userId: number
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/admin/shipments/${shipmentId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignment, userId }),
    });
  }
  async createDriver(driverData: {
    name: string;
    phone: string;
    password: string;
    email?: string;
  }): Promise<{ message: string; user: User }> {
    return this.makeRequest('/auth/create-driver', {
      body: JSON.stringify(driverData),
    });
  }

  async getMyDrivers(): Promise<any> {
    return this.makeRequest('/auth/my-drivers');
  }
}

export const apiService = new ApiService();
