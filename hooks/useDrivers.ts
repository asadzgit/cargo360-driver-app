import { useState, useEffect } from 'react';
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
  };
};

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDrivers();
    }
  }, [user]);

  const loadDrivers = async () => {
    if (!user) return;

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
        const driverUsers: User[] = Array.isArray(res)
          ? res
          : res?.drivers || res?.users || res?.data?.drivers || res?.data?.users || [];
        setDrivers(driverUsers.map(mapUserToDriver));
      } else {
        // For drivers, they only see themselves
        setDrivers([mapUserToDriver(user)]);
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async (driverData: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    try {
      // Use broker/trucker endpoint to create driver (auto-verified)
      const response = await apiService.createDriver({
        name: driverData.name,
        phone: driverData.phone,
        password: driverData.password,
        email: driverData.email,
      });
      
      // Reload drivers to include the new one
      await loadDrivers();
      
      return mapUserToDriver(response.user);
    } catch (err) {
      console.error('Error adding driver:', err);
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
    return drivers.filter(driver => 
      driver.status === 'active' && 
      driver.isApproved && 
      driver.isEmailVerified
    );
  };

  return {
    drivers,
    loading,
    error,
    addDriver,
    updateDriver,
    approveDriver,
    getDriverById,
    getAvailableDrivers,
    reload: loadDrivers,
  };
}