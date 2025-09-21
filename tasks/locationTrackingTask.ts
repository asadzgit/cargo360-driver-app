import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export const LOCATION_TASK_NAME = 'background-location-tracking';
const STORAGE_KEYS = {
  currentShipmentId: 'tracking.currentShipmentId',
  lastSentAt: 'tracking.lastSentAt',
};

// Define the background task once at module load
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  try {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }
    const { locations } = (data || {}) as Location.LocationTaskResponse;
    if (!locations || locations.length === 0) return;

    const shipmentIdStr = await AsyncStorage.getItem(STORAGE_KEYS.currentShipmentId);
    const shipmentId = shipmentIdStr ? parseInt(shipmentIdStr, 10) : null;
    if (!shipmentId) {
      // No active shipment to track
      return;
    }

    // Only send at most once per TEST interval (5 seconds)
    const lastSentAtStr = await AsyncStorage.getItem(STORAGE_KEYS.lastSentAt);
    const now = Date.now();
    const testIntervalMs = 5 * 1000; // TEST: 5 seconds
    if (lastSentAtStr) {
      const last = parseInt(lastSentAtStr, 10);
      if (!isNaN(last) && now - last < testIntervalMs) {
        return; // Skip if last sent < TEST interval
      }
    }

    const latest = locations[locations.length - 1];
    const { latitude, longitude, accuracy, speed, heading } = latest.coords;
    const payload = {
      latitude,
      longitude,
      accuracy: accuracy ?? 0,
      speed: typeof speed === 'number' ? speed * 3.6 : undefined, // m/s -> km/h
      heading: typeof heading === 'number' ? heading : undefined,
      timestamp: new Date(latest.timestamp).toISOString(),
    };

    await apiService.trackShipmentLocation(shipmentId, payload);
    await AsyncStorage.setItem(STORAGE_KEYS.lastSentAt, String(now));
  } catch (e) {
    console.error('Error in background location task:', e);
  }
});

export async function startBackgroundLocationTracking(shipmentId: number) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.currentShipmentId, String(shipmentId));
    await AsyncStorage.removeItem(STORAGE_KEYS.lastSentAt);

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 1000, // TEST: request updates every 5 seconds (Android)
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true, // iOS indicator
      pausesUpdatesAutomatically: false, // iOS keep running
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'Cargo360 Tracking',
        notificationBody: 'Sharing your location for active delivery (TEST 5s)',
        notificationColor: '#2563eb',
      },
    });
  } catch (e) {
    console.error('Failed to start background location tracking:', e);
  }
}

export async function stopBackgroundLocationTracking() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.currentShipmentId);
    await AsyncStorage.removeItem(STORAGE_KEYS.lastSentAt);
  } catch (e) {
    console.error('Failed to stop background location tracking:', e);
  }
}
