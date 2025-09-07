import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useNotifications } from '@/context/NotificationContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Navigation, Target, ArrowLeft, Play, Square, Clock, Route, ExternalLink } from 'lucide-react-native';

console.log('useAuth:', useAuth);
console.log('useNotifications:', useNotifications);
console.log('useLocationTracking:', useLocationTracking);


const { width, height } = Dimensions.get('window');

interface RouteProgress {
  totalDistance: number;
  remainingDistance: number;
  progressPercentage: number;
  estimatedTimeRemaining: number;
  traveledDistance: number;
}

interface JourneyData {
  id: string;
  fromLocation: string;
  toLocation: string;
  fromCoords: { latitude: number; longitude: number };
  toCoords: { latitude: number; longitude: number };
  clientName: string;
  loadType: string;
  vehicleType: string;
  startTime?: string;
}

export default function LiveTrackingScreen() {
  const { user } = useAuth();
  const { journeyId } = useLocalSearchParams();
  const router = useRouter();
  const { 
    location, 
    isTracking, 
    startTracking, 
    stopTracking 
  } = useLocationTracking();
  const { sendNotification } = useNotifications();
  
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [routeProgress, setRouteProgress] = useState<RouteProgress | null>(null);
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((maps) => {
        setMapComponents({
          MapView: maps.default,
          Marker: maps.Marker,
          Polyline: maps.Polyline,
          PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
        });
      });
    }
  }, []);

  // Mock journey data - in real app, fetch from API
  useEffect(() => {
    const mockJourney: JourneyData = {
      id: journeyId as string,
      fromLocation: 'New York, NY',
      toLocation: 'Boston, MA',
      fromCoords: { latitude: 40.7128, longitude: -74.0060 },
      toCoords: { latitude: 42.3601, longitude: -71.0589 },
      clientName: 'ABC Logistics',
      loadType: 'Electronics',
      vehicleType: 'Medium Truck',
    };
    setJourney(mockJourney);
  }, [journeyId]);

  useEffect(() => {
    if (isTracking && location && journey && startLocation) {
      calculateRouteProgress();
      sendLocationToAdmin();
      updateRouteCoordinates();
    }
  }, [location, isTracking, journey, startLocation]);

  const calculateRouteProgress = () => {
    if (!location || !journey || !startLocation) return;

    const currentLat = location.coords.latitude;
    const currentLng = location.coords.longitude;
    const startLat = startLocation.latitude;
    const startLng = startLocation.longitude;
    const destLat = journey.toCoords.latitude;
    const destLng = journey.toCoords.longitude;

    // Calculate distances using Haversine formula
    const totalDistance = calculateDistance(startLat, startLng, destLat, destLng);
    const remainingDistance = calculateDistance(currentLat, currentLng, destLat, destLng);
    const traveledDistance = Math.max(0, totalDistance - remainingDistance);
    
    const progressPercentage = Math.max(0, Math.min(100, (traveledDistance / totalDistance) * 100));
    const averageSpeed = 60; // km/h estimate
    const estimatedTimeRemaining = remainingDistance / averageSpeed;

    setRouteProgress({
      totalDistance,
      remainingDistance,
      traveledDistance,
      progressPercentage,
      estimatedTimeRemaining,
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateRouteCoordinates = () => {
    if (!location || !startLocation || !journey) return;

    const newCoord = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setRouteCoordinates(prev => {
      const updated = [...prev];
      // Add current location if it's significantly different from last point
      const lastCoord = updated[updated.length - 1];
      if (!lastCoord || calculateDistance(
        lastCoord.latitude, lastCoord.longitude,
        newCoord.latitude, newCoord.longitude
      ) > 0.1) { // 100m threshold
        updated.push(newCoord);
      }
      return updated;
    });
  };

  const sendLocationToAdmin = async () => {
    if (!location || !journey) return;

    try {
      const locationData = {
        driverId: user?.id,
        driverName: user?.name,
        journeyId: journey.id,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
        },
        timestamp: location.timestamp,
        progress: routeProgress,
        journey: {
          fromLocation: journey.fromLocation,
          toLocation: journey.toLocation,
          clientName: journey.clientName,
        },
      };

      // Send to admin dashboard
      try {
        await fetch('/api/admin/live-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });
      } catch (fetchError) {
        console.log('Admin API not available, using direct update');
      }

      // Send to client tracking interface
      try {
        await fetch('/api/client/live-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });
      } catch (fetchError) {
        console.log('Client API not available, using direct update');
      }

      // Notify dashboards directly if available
      if (typeof window !== 'undefined' && (window as any).handleDriverLocationUpdate) {
        (window as any).handleDriverLocationUpdate(locationData);
      }
      
      // Notify client tracker if available
      if (typeof window !== 'undefined' && (window as any).clientTracker) {
        (window as any).clientTracker.updateDriverLocation(locationData.location, routeProgress?.progressPercentage / 100 || 0);
      }
    } catch (error) {
      console.error('Failed to send location to admin:', error);
    }
  };

  const handleStartJourney = async () => {
    try {
      await startTracking();
      
      // Set starting location
      if (location) {
        setStartLocation(location.coords);
        setJourney(prev => prev ? { ...prev, startTime: new Date().toISOString() } : null);
        setRouteCoordinates([location.coords]);
      }

      // Start sending regular updates to admin every 5 seconds
      intervalRef.current = setInterval(() => {
        if (location) {
          sendLocationToAdmin();
        }
      }, 5000);

      await sendNotification('journey_started', {
        message: `${user?.name} has started journey to ${journey?.toLocation}`,
        driverName: user?.name,
        journeyId: journey?.id,
      });

      setMilestones(prev => [...prev, `Journey started at ${new Date().toLocaleTimeString()}`]);
      Alert.alert('Journey Started', 'Live tracking is active. Admin can monitor your progress in real-time.');
    } catch (error) {
      Alert.alert('Error', 'Failed to start tracking. Please check location permissions.');
    }
  };

  const handleStopJourney = async () => {
    try {
      await stopTracking();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await sendNotification('journey_completed', {
        message: `${user?.name} has completed journey to ${journey?.toLocation}`,
        driverName: user?.name,
        journeyId: journey?.id,
      });

      setMilestones(prev => [...prev, `Journey completed at ${new Date().toLocaleTimeString()}`]);
      Alert.alert('Journey Completed', 'Tracking stopped. Journey marked as complete.');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop tracking');
    }
  };

  const addMilestone = async (type: string) => {
    const milestoneMessages = {
      picked_up: 'Load picked up',
      checkpoint: 'Reached checkpoint',
      fuel_stop: 'Fuel stop',
      rest_break: 'Rest break',
      delivered: 'Load delivered',
    };

    const milestone = `${milestoneMessages[type]} at ${new Date().toLocaleTimeString()}`;
    setMilestones(prev => [...prev, milestone]);
    
    await sendNotification('milestone_reached', {
      message: `${user?.name}: ${milestoneMessages[type]}`,
      milestone: type,
      driverName: user?.name,
      journeyId: journey?.id,
      location: location,
    });

    sendLocationToAdmin(); // Send immediate update with milestone
  };

  const openExternalMaps = async () => {
    if (!journey) {
      Alert.alert('Error', 'Journey information not available');
      return;
    }

    const { fromCoords, toCoords, fromLocation, toLocation } = journey;
    
    // Create URLs for different map apps
    const googleMapsUrl = `https://www.google.com/maps/dir/${fromCoords.latitude},${fromCoords.longitude}/${toCoords.latitude},${toCoords.longitude}`;
    const appleMapsUrl = `http://maps.apple.com/?saddr=${fromCoords.latitude},${fromCoords.longitude}&daddr=${toCoords.latitude},${toCoords.longitude}&dirflg=d`;
    
    try {
      if (Platform.OS === 'ios') {
        // Try Apple Maps first on iOS
        const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
        if (canOpenAppleMaps) {
          await Linking.openURL(appleMapsUrl);
        } else {
          await Linking.openURL(googleMapsUrl);
        }
      } else {
        // Use Google Maps on Android and web
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open maps application');
    }
  };

  if (user?.role !== 'driver') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Driver access required</Text>
      </View>
    );
  }

  if (!journey) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>Live Tracking</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#059669' : '#64748b' }]}>
          <Text style={styles.statusText}>
            {isTracking ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      <View style={styles.navigationCard}>
        <View style={styles.navigationHeader}>
          <Navigation size={24} color="#2563eb" />
          <Text style={styles.navigationTitle}>Navigation</Text>
        </View>
        
        <View style={styles.routeInfo}>
          <View style={styles.routeItem}>
            <MapPin size={16} color="#059669" />
            <Text style={styles.routeText}>From: {journey.fromLocation}</Text>
          </View>
          <View style={styles.routeItem}>
            <Target size={16} color="#dc2626" />
            <Text style={styles.routeText}>To: {journey.toLocation}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.mapsButton} onPress={openExternalMaps}>
          <ExternalLink size={20} color="#ffffff" />
          <Text style={styles.mapsButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bottomSheet} contentContainerStyle={styles.bottomSheetContent}>
        {routeProgress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Route size={20} color="#2563eb" />
              <Text style={styles.progressTitle}>Journey Progress</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${routeProgress.progressPercentage}%` }
                ]} 
              />
              <Text style={styles.progressText}>{routeProgress.progressPercentage.toFixed(1)}%</Text>
            </View>
            
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{routeProgress.traveledDistance.toFixed(1)} km</Text>
                <Text style={styles.statLabel}>Traveled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{routeProgress.remainingDistance.toFixed(1)} km</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{routeProgress.estimatedTimeRemaining.toFixed(1)}h</Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
            </View>
          </View>
        )}

        {location && (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={20} color="#2563eb" />
              <Text style={styles.locationTitle}>Current Position</Text>
            </View>
            
            <View style={styles.coordinatesGrid}>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text style={styles.coordinateValue}>{location.coords.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text style={styles.coordinateValue}>{location.coords.longitude.toFixed(6)}</Text>
              </View>
            </View>
            
            <View style={styles.additionalInfo}>
              {location.coords.speed && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Speed:</Text>
                  <Text style={styles.infoValue}>{(location.coords.speed * 3.6).toFixed(1)} km/h</Text>
                </View>
              )}
              {location.coords.heading && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Heading:</Text>
                  <Text style={styles.infoValue}>{location.coords.heading.toFixed(0)}°</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Accuracy:</Text>
                <Text style={styles.infoValue}>±{location.coords.accuracy?.toFixed(0)}m</Text>
              </View>
            </View>
          </View>
        )}

        {isTracking && (
          <View style={styles.milestonesCard}>
            <Text style={styles.milestonesTitle}>Quick Updates</Text>
            <View style={styles.milestonesGrid}>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => addMilestone('picked_up')}
              >
                <Text style={styles.milestoneText}>Load Picked Up</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => addMilestone('checkpoint')}
              >
                <Text style={styles.milestoneText}>At Checkpoint</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => addMilestone('fuel_stop')}
              >
                <Text style={styles.milestoneText}>Fuel Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => addMilestone('delivered')}
              >
                <Text style={styles.milestoneText}>Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {milestones.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Journey Timeline</Text>
            <View style={styles.timeline}>
              {milestones.slice(-5).map((milestone, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <Text style={styles.timelineText}>{milestone}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.controlsContainer}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStartJourney}>
              <Play size={20} color="#ffffff" />
              <Text style={styles.startButtonText}>Start Live Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={handleStopJourney}>
              <Square size={20} color="#ffffff" />
              <Text style={styles.stopButtonText}>Complete Journey</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.trackingNote}>
            {isTracking 
              ? 'Your location is being shared with admin in real-time'
              : 'Start tracking to share your location with admin'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginLeft: 16,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  navigationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  routeInfo: {
    marginBottom: 20,
    gap: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  mapsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomSheetContent: {
    padding: 16,
    gap: 16,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    zIndex: 1,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  coordinatesGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  coordinateItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  milestonesCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: (width - 96) / 2,
    alignItems: 'center',
  },
  milestoneText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  timelineText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  controlsContainer: {
    paddingTop: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  trackingNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
});