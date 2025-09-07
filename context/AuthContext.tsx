import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  role: 'broker' | 'driver';
  companyName?: string;
  name?: string;
  phone?: string;
  driverId?: string;
  licenseNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'broker' | 'driver') => Promise<void>;
  loginDriver: (driverId: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
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
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: 'broker' | 'driver') => {
    // Mock authentication - replace with real API
    const mockUser: User = {
      id: 'broker-1',
      email,
      role: 'broker',
      companyName: 'Demo Transport Co.',
    };
    
    setUser(mockUser);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
  };

  const loginDriver = async (driverId: string, password: string) => {
    // Mock authentication - replace with real API
    const mockDriver: User = {
      id: 'driver-1',
      email: 'driver@example.com',
      role: 'driver',
      name: 'John Smith',
      phone: '+1 234 567 8900',
      driverId,
      licenseNumber: 'DL123456789',
    };
    
    setUser(mockDriver);
    await AsyncStorage.setItem('user', JSON.stringify(mockDriver));
  };

  const register = async (email: string, password: string, companyName: string) => {
    // Mock registration - replace with real API
    const newUser: User = {
      id: `broker-${Date.now()}`,
      email,
      role: 'broker',
      companyName,
    };
    
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      loginDriver,
      register,
      logout,
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