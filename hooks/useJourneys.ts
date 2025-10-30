import { useState, useEffect } from 'react';
import { apiService, Shipment } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Map API shipment to Journey interface for backward compatibility
interface Journey {
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
  // Additional fields from API
  budget?: number;
  cargoWeight?: number;
  cargoSize?: string;
  description?: string;
}

const mapShipmentToJourney = (shipment: Shipment): Journey => {
  // Map API status to Journey status
  const statusMap: Record<string, Journey['status']> = {
    'pending': 'pending',
    'accepted': 'assigned',
    'picked_up': 'in_progress',
    'in_transit': 'in_progress',
    'delivered': 'completed',
    'cancelled': 'cancelled',
  };

  return {
    id: shipment.id.toString(),
    clientId: shipment.customerId.toString(),
    driverId: shipment.driverId?.toString() || shipment.truckerId?.toString(),
    driverName: shipment.Driver?.name || shipment.Trucker?.name,
    vehicleType: shipment.vehicleType,
    loadType: shipment.cargoType,
    fromLocation: shipment.pickupLocation,
    toLocation: shipment.dropLocation,
    status: statusMap[shipment.status] || 'pending',
    createdAt: shipment.createdAt,
    assignedAt: shipment.status === 'accepted' ? shipment.updatedAt : undefined,
    startedAt: shipment.status === 'picked_up' || shipment.status === 'in_transit' ? shipment.updatedAt : undefined,
    completedAt: shipment.status === 'delivered' ? shipment.updatedAt : undefined,
    budget: shipment.budget,
    cargoWeight: shipment.cargoWeight,
    cargoSize: shipment.cargoSize,
    description: shipment.description,
  };
};

export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJourneys();
    }
  }, [user]);

  const loadJourneys = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (user.role === 'customer') {
        // Load customer's own shipments
        response = await apiService.getMyShipments();
      } else if (user.role === 'driver' || user.role === 'trucker') {
        // Load available shipments for drivers/truckers, plus their assigned ones
        // const requests = [apiService.getAvailableShipments()];
        const requests = [];
        // Use role-specific endpoint for assigned shipments
        if (user.role === 'driver') {
          requests.push(apiService.getDriverShipments());
        } else if (user.role === 'trucker') {
          requests.push(apiService.getTruckerShipments());
        }
        
        const [availableResponse, assignedResponse] = await Promise.all(requests);
        
        // Combine available and assigned shipments, avoiding duplicates
        const availableShipments = availableResponse.data.shipments;
        const assignedShipments = assignedResponse ? assignedResponse.data.shipments : [];
        const assignedIds = new Set(assignedShipments.map(s => s.id));
        
        const allShipments = [
          ...assignedShipments,
          ...availableShipments.filter(s => !assignedIds.has(s.id))
        ];
        
        response = { data: { shipments: allShipments } };
      } else if (user.role === 'admin') {
        // Load all shipments for admin
        const adminResponse = await apiService.getAllShipments();
        response = { data: { shipments: adminResponse.shipments } };
      } else {
        throw new Error('Invalid user role');
      }

      const mappedJourneys = response.data.shipments.map(mapShipmentToJourney);
      setJourneys(mappedJourneys);
    } catch (err) {
      console.error('Error loading journeys:', err);
      setError(err instanceof Error ? err.message : 'Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const assignJourney = async (journeyId: string, driverId: string, driverName: string) => {
    try {
      if (user?.role === 'admin') {
        // Admin assigns shipment
        await apiService.assignShipment(parseInt(journeyId), 'driver', parseInt(driverId));
      } else if (user?.role === 'driver' || user?.role === 'trucker') {
        // Driver/trucker accepts shipment
        await apiService.acceptShipment(parseInt(journeyId));
      }
      
      // Reload journeys to get updated data
      await loadJourneys();
    } catch (err) {
      console.error('Error assigning journey:', err);
      throw err;
    }
  };

  // Broker assigns a journey to a driver explicitly
  const assignDriverToJourney = async (journeyId: string, driverId: string) => {
    try {
      if (user?.role !== 'trucker') {
        throw new Error('Only brokers can assign drivers');
      }
      await apiService.assignJourneyToDriver(parseInt(journeyId), parseInt(driverId));
      await loadJourneys();
    } catch (err) {
      console.error('Error assigning driver to journey:', err);
      throw err;
    }
  };

  const updateJourneyStatus = async (journeyId: string, status: Journey['status']) => {
    try {
      // Map Journey status back to API status
      const apiStatusMap: Record<Journey['status'], string> = {
        'pending': 'pending',
        'assigned': 'accepted',
        'in_progress': 'picked_up', // Default to picked_up, can be updated to in_transit later
        'completed': 'delivered',
        'cancelled': 'cancelled',
      };

      const apiStatus = apiStatusMap[status];
      if (!apiStatus || apiStatus === 'pending' || apiStatus === 'accepted') {
        throw new Error('Invalid status transition');
      }

      await apiService.updateShipmentStatus(
        parseInt(journeyId),
        apiStatus as 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
      );
      
      // Reload journeys to get updated data
      await loadJourneys();
    } catch (err) {
      console.error('Error updating journey status:', err);
      throw err;
    }
  };

  const createJourney = async (journeyData: {
    pickupLocation: string;
    dropLocation: string;
    cargoType: string;
    description: string;
    vehicleType: 'truck' | 'van' | 'pickup' | 'trailer' | 'container';
    cargoWeight?: number;
    cargoSize?: string;
    budget?: number;
  }) => {
    try {
      await apiService.createShipment(journeyData);
      // Reload journeys to include the new one
      await loadJourneys();
    } catch (err) {
      console.error('Error creating journey:', err);
      throw err;
    }
  };

  const cancelJourney = async (journeyId: string) => {
    try {
      await apiService.cancelShipment(parseInt(journeyId));
      // Reload journeys to get updated data
      await loadJourneys();
    } catch (err) {
      console.error('Error cancelling journey:', err);
      throw err;
    }
  };

  return {
    journeys,
    loading,
    error,
    assignJourney,
    updateJourneyStatus,
    createJourney,
    cancelJourney,
    reload: loadJourneys,
    assignDriverToJourney,
  };
}