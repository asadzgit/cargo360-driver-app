import { useState, useEffect, useRef } from 'react';
import { apiService, User } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Driver {
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
  hasSignedUp?: boolean; // Optional to handle old data where it might be undefined
}

// Map API User to Driver interface for backward compatibility
const mapUserToDriver = (user: User): Driver => {
  return {
    id: user.id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    licenseNumber: undefined, // Not available in API, could be added later
    driverId: user.id.toString(), // Use user ID as driver ID
    status: user.isApproved ? 'active' : 'inactive',
    currentLocation: undefined, // Not available in API
    brokerId: 'admin', // Simplified for now
    createdAt: user.createdAt || new Date().toISOString(),
    isApproved: user.isApproved,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified ?? false,
    hasSignedUp: user.hasSignedUp, // Can be true, false, or undefined (for old data)
  };
};

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const lastLoadTimeRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (user) {
      loadDrivers();
    }
  }, [user]);

  const loadDrivers = async (force = false) => {
    if (!user) return;

    // Prevent too frequent requests (throttle to at most once per 2 seconds)
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (!force && (loadingRef.current || timeSinceLastLoad < 2000)) {
      return;
    }

    loadingRef.current = true;
    lastLoadTimeRef.current = now;
    setLoading(true);
    setError(null);
    
    try {
      if (user.role === 'admin') {
        // Admin can see all users, filter for drivers
        const response = await apiService.getAllUsers();
        const driverUsers = response.users.filter(u => u.role === 'driver');
        const mappedDrivers = driverUsers.map(mapUserToDriver);
        setDrivers(mappedDrivers);
      } else if (user.role === 'customer') {
        // Customers might see drivers assigned to their shipments
        const shipmentsResponse = await apiService.getMyShipments();
        const driversSet = new Set<string>();
        const driversList: Driver[] = [];
        
        shipmentsResponse.data.shipments.forEach(shipment => {
          if (shipment.Driver && !driversSet.has(shipment.Driver.id.toString())) {
            driversSet.add(shipment.Driver.id.toString());
            driversList.push(mapUserToDriver(shipment.Driver));
          }
          if (shipment.Trucker && !driversSet.has(shipment.Trucker.id.toString())) {
            driversSet.add(shipment.Trucker.id.toString());
            driversList.push(mapUserToDriver(shipment.Trucker));
          }
        });
        
        setDrivers(driversList);
      } else if (user.role === 'trucker' || user.role === 'moderator') {
        // Trucker/Moderator: list their drivers via API
        const res: any = await apiService.getMyDrivers();
        // Support multiple possible response shapes
        // API returns: { success: true, data: { count, drivers } }
        const driverUsers: User[] = Array.isArray(res)
          ? res
          : res?.data?.drivers || res?.drivers || res?.users || res?.data?.users || [];
        console.log('[useDrivers] Raw API response:', JSON.stringify(res, null, 2));
        console.log('[useDrivers] Extracted drivers:', driverUsers.length);
        const mapped = driverUsers.map(mapUserToDriver);
        console.log('[useDrivers] Mapped drivers:', mapped.map(d => ({ 
          id: d.id, 
          name: d.name, 
          hasSignedUp: d.hasSignedUp, 
          isPhoneVerified: d.isPhoneVerified, 
          isEmailVerified: d.isEmailVerified 
        })));
        setDrivers(mapped);
      } else {
        // For drivers, they only see themselves
        setDrivers([mapUserToDriver(user)]);
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drivers';
      setError(errorMessage);
      // Don't show rate limit errors as critical - just log them
      if (errorMessage.includes('Too many requests')) {
        console.warn('Rate limited - will retry on next focus');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const addDriver = async (driverData: {
    name: string;
    phone: string;
  }) => {
    try {
      const res = await apiService.addDriverByBroker({
        name: driverData.name,
        phone: driverData.phone,
      });
      await loadDrivers();
      return res;
    } catch (err) {
      console.error('Error adding driver:', err);
      throw err;
    }
  };

  const removeDriver = async (driverId: string) => {
    try {
      await apiService.removeDriver(parseInt(driverId));
      await loadDrivers(true); // Force reload after removal
    } catch (err) {
      // Error message is already user-friendly from api.ts
      console.error('Error removing driver:', err);
      throw err;
    }
  };

  const updateDriver = async (driverId: string, updates: Partial<Driver>) => {
    try {
      // Note: The current API doesn't have a direct update user endpoint
      // This would need to be implemented on the backend
      // For now, we'll just update locally and reload
      
      if (user?.role === 'admin' && updates.isApproved !== undefined) {
        // Admin can approve drivers
        await apiService.approveUser(parseInt(driverId));
      }
      
      // Reload drivers to get updated data
      await loadDrivers();
    } catch (err) {
      console.error('Error updating driver:', err);
      throw err;
    }
  };

  const approveDriver = async (driverId: string) => {
    try {
      if (user?.role !== 'admin') {
        throw new Error('Only admins can approve drivers');
      }
      
      await apiService.approveUser(parseInt(driverId));
      await loadDrivers();
    } catch (err) {
      console.error('Error approving driver:', err);
      throw err;
    }
  };

  const getDriverById = (driverId: string): Driver | undefined => {
    return drivers.find(driver => driver.id === driverId);
  };

  const getAvailableDrivers = (): Driver[] => {
    // Only show drivers who have signed up AND verified their account (OTP or email)
    // Drivers who haven't verified OTP are considered non-account holders
    // If hasSignedUp is not set (undefined for old data), check verification status (verified = signed up)
    const filtered = drivers.filter(driver => {
      // Must have verified either phone (OTP) or email
      const isVerified = driver.isPhoneVerified === true || driver.isEmailVerified === true;
      if (!isVerified) {
        return false; // Not verified = no account
      }
      
      // Check if driver has signed up
      // If hasSignedUp is explicitly false, exclude them (added by broker, hasn't signed up)
      // If hasSignedUp is undefined (old data before migration), consider verified drivers as signed up
      // If hasSignedUp is null, treat same as undefined (old data)
      if (driver.hasSignedUp === false) {
        return false; // Explicitly not signed up
      }
      
      // hasSignedUp is true OR undefined/null (old data) - if verified, they have an account
      return true;
    });
    
    // Debug logging
    console.log('[getAvailableDrivers] Total drivers:', drivers.length);
    console.log('[getAvailableDrivers] Filtered drivers:', filtered.length);
    if (drivers.length > 0) {
      console.log('[getAvailableDrivers] Driver details:', drivers.map(d => ({
        id: d.id,
        name: d.name,
        hasSignedUp: d.hasSignedUp,
        isPhoneVerified: d.isPhoneVerified,
        isEmailVerified: d.isEmailVerified,
        passed: filtered.some(f => f.id === d.id)
      })));
    }
    
    return filtered;
  };

  return {
    drivers,
    loading,
    error,
    addDriver,
    removeDriver,
    updateDriver,
    approveDriver,
    getDriverById,
    getAvailableDrivers,
    reload: loadDrivers,
  };
}