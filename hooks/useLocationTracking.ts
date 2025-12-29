import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { apiService } from '@/services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface UseLocationTrackingProps {
  shipmentId?: number | null;
  isTracking?: boolean;
}

export const useLocationTracking = ({ shipmentId = null, isTracking = false }: UseLocationTrackingProps = {}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentLocationRef = useRef<LocationData | null>(null);

  // Request location permissions
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Start/stop tracking based on isTracking prop
  useEffect(() => {
    if (isTracking && hasPermission && shipmentId) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isTracking, hasPermission, shipmentId]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track your journey and provide real-time updates to customers.',
          [{ text: 'OK' }]
        );
        setHasPermission(false);
        return;
      }

      // Also request background permissions for continuous tracking
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Background Location',
          'For best tracking experience, please allow location access "Always" in settings.',
          [{ text: 'OK' }]
        );
      }

      setHasPermission(true);
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasPermission(false);
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // Use cached location if less than 10 seconds old
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed ? location.coords.speed * 3.6 : undefined, // Convert m/s to km/h
        heading: location.coords.heading || undefined,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const sendLocationToServer = async (locationData: LocationData) => {
    if (!shipmentId) return;

    try {
      await apiService.trackShipmentLocation(shipmentId, locationData);
      lastSentLocationRef.current = locationData;
      console.log('Location sent successfully:', locationData);
    } catch (error) {
      console.error('Error sending location to server:', error);
      // Don't show alert for network errors to avoid interrupting driver
    }
  };

  const startLocationTracking = async () => {
    if (!hasPermission || !shipmentId) return;

    console.log('Starting location tracking for shipment:', shipmentId);
    setIsLocationEnabled(true);

    // Send initial location immediately
    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      await sendLocationToServer(initialLocation);
    }

    // Set up interval to send location every 5 seconds (TEST ONLY)
    intervalRef.current = setInterval(async () => {
      const location = await getCurrentLocation();
      if (location) {
        await sendLocationToServer(location);
      }
    }, 5 * 1000); // 5 seconds (TEST)
  };

  const stopLocationTracking = () => {
    console.log('Stopping location tracking');
    setIsLocationEnabled(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const sendLocationNow = async () => {
    const location = await getCurrentLocation();
    if (location && shipmentId) {
      await sendLocationToServer(location);
    }
    return location;
  };

  return {
    hasPermission,
    currentLocation,
    isLocationEnabled,
    requestLocationPermission,
    sendLocationNow,
    lastSentLocation: lastSentLocationRef.current,
  };
};