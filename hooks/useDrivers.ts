import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Driver {
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

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const storedDrivers = await AsyncStorage.getItem('drivers');
      if (storedDrivers) {
        setDrivers(JSON.parse(storedDrivers));
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async (driverData: {
    name: string;
    phone: string;
    licenseNumber: string;
  }) => {
    const newDriver: Driver = {
      id: `driver-${Date.now()}`,
      ...driverData,
      driverId: generateDriverId(),
      status: 'inactive',
      brokerId: 'current-broker', // In real app, get from auth context
      createdAt: new Date().toISOString(),
    };

    const updatedDrivers = [...drivers, newDriver];
    setDrivers(updatedDrivers);
    await AsyncStorage.setItem('drivers', JSON.stringify(updatedDrivers));
    return newDriver;
  };

  const updateDriver = async (driverId: string, updates: Partial<Driver>) => {
    const updatedDrivers = drivers.map(driver =>
      driver.id === driverId ? { ...driver, ...updates } : driver
    );
    setDrivers(updatedDrivers);
    await AsyncStorage.setItem('drivers', JSON.stringify(updatedDrivers));
  };

  const generateDriverId = (): string => {
    return `DRV${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  return {
    drivers,
    loading,
    addDriver,
    updateDriver,
    reload: loadDrivers,
  };
}