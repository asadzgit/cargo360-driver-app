import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export function useLocationTracking() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // For web, use browser geolocation API
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            resolve(result.state === 'granted' || result.state === 'prompt');
          }).catch(() => resolve(false));
        } else {
          resolve(false);
        }
      });
    }

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setError('Location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied');
      }

      return true;
    } catch (error) {
      setError('Failed to request permissions');
      return false;
    }
  };

  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission required');
    }

    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation for web
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            });
          },
          (error) => {
            setError(`Location error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000,
          }
        );

        // Store watch ID for cleanup
        watchSubscription.current = {
          remove: () => navigator.geolocation.clearWatch(watchId),
        } as Location.LocationSubscription;
      } else {
        // Use Expo Location for native platforms
        watchSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      }

      setIsTracking(true);
      setError(null);
    } catch (error) {
      setError('Failed to start tracking');
      throw error;
    }
  };

  const stopTracking = async () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
    setIsTracking(false);
  };

  const sendLocationUpdate = async (journeyId: string) => {
    if (!location) {
      throw new Error('No location available');
    }

    try {
      // Send location update to admin dashboard
      const locationData = {
        journeyId,
        driverId: 'current-driver-id', // Get from auth context
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
        },
        timestamp: location.timestamp,
      };

      // Send to admin dashboard (WebSocket in real app)
      const response = await fetch('/api/admin/live-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error('Failed to send location update');
      }

      // Also notify admin dashboard directly if available
      if (typeof window !== 'undefined' && window.handleDriverLocationUpdate) {
        window.handleDriverLocationUpdate(locationData);
      }
    } catch (error) {
      console.error('Error sending location update:', error);
      // Don't throw error to avoid disrupting tracking
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              });
            },
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
          );
        });
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        return location;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    sendLocationUpdate,
    getCurrentLocation,
  };
}