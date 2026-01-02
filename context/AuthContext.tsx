import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';
import socketService from '@/services/socketService';
// import { stopBackgroundLocationTracking } from '@/tasks/locationTrackingTask';
interface User {
  id: number;
  email: string;
  role: 'customer' | 'trucker' | 'driver' | 'admin';
  name: string;
  phone: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  company?: string;
  cnic?: string;
  license?: string;
  vehicleRegistration?: string;
  // Legacy fields for backward compatibility
  companyName?: string;
  driverId?: string;
  licenseNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authReady: boolean;
  setUser: (user: User | null) => Promise<void>;
  login: (email: string, password: string, role?: 'customer' | 'trucker' | 'driver') => Promise<void>;
  loginDriver: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'trucker' | 'driver';
  }) => Promise<void>;
  logout: () => Promise<void>;
  // phone-based login with PIN
  phoneLogin: (phone: string, pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    bootstrapSession();
  }, []);

  const bootstrapSession = async () => {
    setIsLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        await clearSession();
        return;
      }

      const profileResponse = await apiService.getProfile();
      setUser(profileResponse.user);
      await AsyncStorage.setItem('user', JSON.stringify(profileResponse.user));

      // Connect socket after successful session bootstrap
      socketService.connect(accessToken);
    } catch (error) {
      console.warn('Session bootstrap failed:', error);
      await clearSession();
    } finally {
      setIsLoading(false);
      setAuthReady(true);
    }
  };

  const clearSession = async () => {
    // Disconnect socket on logout
    socketService.disconnect();
    await Promise.all([
      tokenStorage.clearTokens(),
      AsyncStorage.removeItem('user'),
    ]);
    setUser(null);
  };

  const login = async (email: string, password: string, role?: 'customer' | 'trucker' | 'driver') => {
    try {
      const response = await apiService.login(email, password);
      
      // Check if user role matches expected role (if provided)
      if (role && response.user.role !== role) {
        throw new Error(`Invalid role. Expected ${role}, got ${response.user.role}`);
      }
      
      // Check if user is approved (for truckers and drivers)
      if ((response.user.role === 'trucker' || response.user.role === 'driver') && !response.user.isApproved) {
        throw new Error('Your account is pending approval. Please contact an administrator.');
      }
      
      // Check if email is verified
      if (!response.user.isEmailVerified) {
        throw new Error('Please verify your email address before logging in.');
      }
      
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Connect socket after successful login
      socketService.connect(response.accessToken);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginDriver = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      // Ensure user is a driver
      if (response.user.role !== 'driver') {
        throw new Error('Invalid driver credentials');
      }
      
      // Check if driver is approved
      if (!response.user.isApproved) {
        throw new Error('Your driver account is pending approval. Please contact your broker.');
      }
      
      // Check if email is verified
      if (!response.user.isEmailVerified) {
        throw new Error('Please verify your email address before logging in.');
      }
      
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Connect socket after successful login
      socketService.connect(response.accessToken);
    } catch (error) {
      console.error('Driver login error:', error);
      throw error;
    }
  };

  // Phone-based login via PIN
  const phoneLogin = async (phone: string, pin: string) => {
    try {
      const response = await apiService.phoneLogin({ phone, pin });
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Connect socket after successful login
      socketService.connect(response.accessToken);
    } catch (error) {
      // Don't log to console - let the UI handle the error message
      throw error;
    }
  };


  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'customer' | 'trucker' | 'driver';
  }) => {
    try {
      const response = await apiService.signup(userData);
      
      // For customers, they can login immediately after signup
      // For truckers and drivers, they need approval first
      if (userData.role === 'customer') {
        // Auto-login for customers
        await login(userData.email, userData.password);
      } else {
        // For truckers and drivers, just show success message
        // They'll need to wait for approval
        console.log('Registration successful.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearSession();
    }
  };

  const updateUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      authReady,
      setUser: updateUser,
      login,
      loginDriver,
      register,
      logout,
      phoneLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}