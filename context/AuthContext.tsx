import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User as ApiUser } from '@/services/api';
// import { stopBackgroundLocationTracking } from '@/tasks/locationTrackingTask';
interface User {
  id: number;
  email: string;
  role: 'customer' | 'trucker' | 'driver' | 'admin';
  name: string;
  phone: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  // Legacy fields for backward compatibility
  companyName?: string;
  driverId?: string;
  licenseNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
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

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Verify token is still valid by fetching profile
        try {
          const profileResponse = await apiService.getProfile();
          setUser(profileResponse.user);
        } catch (error) {
          // Token might be expired, clear stored data
          console.log('Token expired, clearing stored user');
          await apiService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
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
    } catch (error) {
      console.error('Phone login error:', error);
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
    await Promise.all([
      AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
        // 'tracking.currentShipmentId',
        // 'tracking.lastSentAt',
      ]),
    ]);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    setUser(null);
  }
};

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
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