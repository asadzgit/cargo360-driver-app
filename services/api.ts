import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '@/services/tokenStorage';

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
  isPhoneVerified?: boolean;
  hasSignedUp?: boolean;
  company?: string;
  cnic?: string;
  license?: string;
  vehicleRegistration?: string;
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

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

class ApiService {
  private refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuthRefresh, ...rest } = options;
    const token = await tokenStorage.getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    };

    const config: RequestInit = {
      ...rest,
      headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401 && !skipAuthRefresh && token) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.makeRequest<T>(endpoint, {
          ...options,
          skipAuthRefresh: true,
        });
      }

      await tokenStorage.clearTokens();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await this.parseResponse(response);

    if (!response.ok) {
      // Handle HTML error responses (like 404 pages)
      if (data?.isHtmlError) {
        const errorMsg = data.error || 'API endpoint not found';
        // Provide user-friendly message for DELETE route not found
        if (errorMsg.includes('Cannot DELETE')) {
          throw new Error('Remove driver feature is not available on the server yet. Please contact support.');
        }
        throw new Error(errorMsg);
      }
      throw new Error(data?.error || data?.message || 'API request failed');
    }

    return data;
  }

  private async parseResponse(response: Response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    // Check if response is HTML (error page) - do this before trying to parse JSON
    const trimmedText = text.trim();
    if (trimmedText.startsWith('<!DOCTYPE html>') || trimmedText.startsWith('<html')) {
      // Extract error message from HTML
      const match = text.match(/<pre>(.*?)<\/pre>/i) || text.match(/<title>(.*?)<\/title>/i);
      const errorMsg = match ? match[1].trim() : 'API endpoint not found';
      return { isHtmlError: true, error: errorMsg };
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      // Only log warning if it's not HTML (we already handled HTML above)
      if (!trimmedText.startsWith('<!DOCTYPE') && !trimmedText.startsWith('<html')) {
        console.warn('Failed to parse response JSON:', error);
      }
      // If it's not HTML and not JSON, return as plain text message
      return { message: text };
    }
  }

  private async tryRefreshToken() {
    try {
      await this.performTokenRefresh();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private performTokenRefresh() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokenRequest().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async refreshTokenRequest() {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      const text = await response.text();
      if (contentType && contentType.includes('application/json')) {
        data = JSON.parse(text);
      } else {
        // If response is not JSON, it's likely an error page
        throw new Error(`Server returned non-JSON response. Status: ${response.status}. The endpoint may not exist.`);
      }
    } catch (parseError: any) {
      if (parseError instanceof Error && parseError.message.includes('non-JSON')) {
        throw parseError;
      }
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `API request failed with status ${response.status}`);
    }

    await tokenStorage.saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data;
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await tokenStorage.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  // convenience helper: phone login (phone in "email" field per API spec)
  // async loginWithPhone(phone: string, password: string): Promise<LoginResponse> {
  //   return this.login(phone, password);
  // }

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

  async updateMe(updates: {
    name?: string;
    phone?: string;
    company?: string;
    cnic?: string;
    license?: string;
    vehicleRegistration?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    return this.makeRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    return this.refreshTokenRequest();
  }

  async logout(): Promise<void> {
    await Promise.all([
      tokenStorage.clearTokens(),
      AsyncStorage.removeItem('user'),
    ]);
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
    console.log('Getting shipment:', shipmentId);
    const response = await this.makeRequest<ApiResponse<{ shipment: Shipment }>>(`/shipments/${shipmentId}`);
    console.log('Response:', response.data);
    return response;
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
  // async createDriver(driverData: {
  //   name: string;
  //   phone: string;
  //   password: string;
  //   email?: string;
  // }): Promise<{ message: string; user: User }> {
  //   return this.makeRequest('/auth/create-driver', {
  //     body: JSON.stringify(driverData),
  //   });
  // }

  async getMyDrivers(): Promise<any> {
    return this.makeRequest('/users/drivers');
  }

  // convenience helper: phone login (phone in "email" field per API spec)
  async loginWithPhone(phone: string, password: string): Promise<LoginResponse> {
    return this.login(phone, password);
  }

  // Phone-based auth endpoints
  async checkPhone(params: { phone: string; role: 'trucker' | 'driver' }): Promise<
    | { exists: false; nextStep: 'signup_required' }
    | { exists: true; userId: string; isPhoneVerified: false; hasPin: false; nextStep: 'verify_otp'; message: string }
    | { exists: true; userId: string; isPhoneVerified: true; hasPin: true; nextStep: 'enter_pin' }
    | { exists: true; userId: string; isPhoneVerified: true; hasPin: false; nextStep: 'set_pin' }
  > {
    return this.makeRequest('/auth/phone/check', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async phoneSignup(params: { name: string; phone: string; role: 'trucker' | 'driver' }): Promise<{ userId: string; nextStep: 'verify_otp'; message: string }> {
    return this.makeRequest('/auth/phone/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async verifyOtp(params: { phone: string; otp: string }): Promise<{ success: true; nextStep: 'set_pin' | 'enter_pin' }> {
    return this.makeRequest('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async setPin(params: { phone: string; pin: string }): Promise<{ success: true; nextStep: 'enter_pin' }> {
    return this.makeRequest('/auth/phone/set-pin', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async phoneLogin(params: { phone: string; pin: string }): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/phone/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    await tokenStorage.saveTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  async resendOtp(params: { phone: string }): Promise<{ success: true; message: string }> {
    return this.makeRequest('/auth/phone/resend-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Note: forgotPin and resetPin are handled through the existing checkPhone/verifyOtp/setPin flow
  // These methods are kept for API consistency but the actual flow uses existing endpoints
  async forgotPin(params: { phone: string }): Promise<{ success: true; message: string }> {
    // This method is not used - the flow uses checkPhone instead
    // Kept for API consistency
    return this.checkPhone({ phone: params.phone, role: 'driver' }).then(() => ({
      success: true as const,
      message: 'OTP sent',
    }));
  }

  async resetPin(params: { phone: string; code: string; pin: string }): Promise<{ success: true; message: string }> {
    // This method is not used - the flow uses verifyOtp + setPin instead
    // Kept for API consistency
    return this.setPin({ phone: params.phone, pin: params.pin }).then(() => ({
      success: true as const,
      message: 'PIN reset successfully',
    }));
  }

  // async assignShipment(
  //   shipmentId: number,
  //   assignment: 'trucker' | 'driver',
  //   userId: number
  // ): Promise<ApiResponse<{ shipment: Shipment }>> {
  //   return this.makeRequest(`/admin/shipments/${shipmentId}/assign`, {
  //     method: 'PATCH',
  //     body: JSON.stringify({ assignment, userId }),
  //   });
  // }
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

  // Broker adds driver (hierarchy)
  async addDriverByBroker(params: { name: string; phone: string }): Promise<{ driverId: string; nextStep: 'verify_otp'; message: string }> {
    return this.makeRequest('/users/drivers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Broker removes driver
  async removeDriver(driverId: number): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/users/drivers/${driverId}`, {
      method: 'DELETE',
    });
  }

  // Broker assigns a journey(shipment) to a specific driver
  // NOTE: Confirm backend route; placeholder assumes PATCH /shipments/:id/assign-driver
  async assignJourneyToDriver(
    shipmentId: number,
    driverId: number
  ): Promise<ApiResponse<{ shipment: Shipment }>> {
    return this.makeRequest(`/shipments/${shipmentId}/assign-driver`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    });
  }
}

export const apiService = new ApiService();
