import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      const storedJourneys = await AsyncStorage.getItem('journeys');
      if (storedJourneys) {
        setJourneys(JSON.parse(storedJourneys));
      } else {
        // Initialize with mock data for demo
        const mockJourneys: Journey[] = [
          {
            id: 'journey-1',
            clientId: 'client-1',
            vehicleType: 'Small Truck',
            loadType: 'Electronics',
            fromLocation: 'New York, NY',
            toLocation: 'Boston, MA',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'journey-2',
            clientId: 'client-2',
            driverId: 'driver-1',
            driverName: 'John Smith',
            vehicleType: 'Large Truck',
            loadType: 'Furniture',
            fromLocation: 'Chicago, IL',
            toLocation: 'Detroit, MI',
            status: 'in_progress',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            assignedAt: new Date(Date.now() - 43200000).toISOString(),
            startedAt: new Date(Date.now() - 21600000).toISOString(),
          },
        ];
        setJourneys(mockJourneys);
        await AsyncStorage.setItem('journeys', JSON.stringify(mockJourneys));
      }
    } catch (error) {
      console.error('Error loading journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignJourney = async (journeyId: string, driverId: string, driverName: string) => {
    const updatedJourneys = journeys.map(journey =>
      journey.id === journeyId
        ? {
            ...journey,
            driverId,
            driverName,
            status: 'assigned' as const,
            assignedAt: new Date().toISOString(),
          }
        : journey
    );
    setJourneys(updatedJourneys);
    await AsyncStorage.setItem('journeys', JSON.stringify(updatedJourneys));
  };

  const updateJourneyStatus = async (journeyId: string, status: Journey['status']) => {
    const updatedJourneys = journeys.map(journey => {
      if (journey.id === journeyId) {
        const updates: Partial<Journey> = { status };
        
        if (status === 'in_progress') {
          updates.startedAt = new Date().toISOString();
        } else if (status === 'completed') {
          updates.completedAt = new Date().toISOString();
        }
        
        return { ...journey, ...updates };
      }
      return journey;
    });
    
    setJourneys(updatedJourneys);
    await AsyncStorage.setItem('journeys', JSON.stringify(updatedJourneys));
  };

  return {
    journeys,
    loading,
    assignJourney,
    updateJourneyStatus,
    reload: loadJourneys,
  };
}