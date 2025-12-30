import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useJourneys } from '@/hooks/useJourneys';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { apiService } from '@/services/api';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '@/tasks/locationTrackingTask';
import { JourneyDetails } from '@/components/JourneyDetails';

export default function JourneyDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  // Normalize id - handle both string and array cases from expo-router
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingJourney, setStartingJourney] = useState(false);
  const [completingJourney, setCompletingJourney] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { journeys, reload: reloadJourneys } = useJourneys();

  // Location tracking - only track when:
  // 1. User is the assigned driver
  // 2. Journey is in progress
  const isJourneyInProgress = journey?.status === 'in_progress' ||
  journey?.status === 'in_transit' ||
  journey?.status === 'picked_up';
  const isUserAssignedDriver = user?.role === 'driver' && journey?.driverId === user.id.toString();
  const shouldTrackLocation = isUserAssignedDriver && isJourneyInProgress;
  
  const { 
    hasPermission, 
    currentLocation, 
    isLocationEnabled,
    requestLocationPermission,
    sendLocationNow 
  } = useLocationTracking({
    shipmentId: journey ? parseInt(journey.id) : null,
    isTracking: shouldTrackLocation,
  });

  useEffect(() => {
    loadJourneyDetails();
  }, [id, journeys]);

  const loadJourneyDetails = async (forceRefresh = false) => {
    if (!id) {
      console.warn('No journey ID provided');
      return;
    }

    // Normalize ID to string for consistent comparison
    const normalizedId = String(id).trim();
    console.log('Loading journey details:', {
      id: normalizedId,
      idType: typeof id,
      journeysCount: journeys.length,
      forceRefresh,
      journeyIds: journeys.map(j => ({ id: j.id, type: typeof j.id })),
    });

    setLoading(true);
    try {
      // Always fetch from API to ensure data consistency
      // The cache might have stale or incorrect data, especially when navigating from different pages
      // This ensures we always get the correct journey details regardless of where the user clicks
      console.log('Fetching from API to ensure data consistency. Cache has', journeys.length, 'journeys');

      console.log('Fetching journey from API for ID:', normalizedId);
      // Always fetch from API when force refresh or not in cache
      const shipmentId = parseInt(normalizedId);
      if (isNaN(shipmentId)) {
        console.error('Invalid journey ID:', normalizedId);
        Alert.alert('Error', 'Invalid journey ID');
        return;
      }
      const response = await apiService.getShipment(shipmentId);
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      
      // Check if response exists
      if (!response) {
        console.error('No response received from API');
        Alert.alert('Error', 'Failed to load journey details: No response from server');
        return;
      }
      
      // Handle different possible response structures
      let shipment;
      if (response.data?.shipment) {
        // Expected structure: { success: true, data: { shipment: {...} } }
        shipment = response.data.shipment;
      } else if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        // Fallback: shipment might be directly in data
        console.warn('Shipment found directly in response.data, not in response.data.shipment');
        shipment = response.data as any;
      } else if ((response as any).shipment) {
        // Fallback: shipment might be directly in response (handle unexpected API response)
        console.warn('Shipment found directly in response, not in response.data.shipment');
        shipment = (response as any).shipment;
      } else {
        console.error('Shipment not found in response. Response structure:', {
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          responseKeys: Object.keys(response),
          fullResponse: response,
        });
        Alert.alert(
          'Error',
          'Failed to load journey details: Shipment data not found in response'
        );
        return;
      }
      
      if (!shipment) {
        console.error('Shipment is undefined after all checks. Response:', response);
        Alert.alert('Error', 'Failed to load journey details: Shipment not found');
        return;
      }
      
      // Verify the shipment ID matches what we requested
      const shipmentIdStr = String(shipment.id).trim();
      if (shipmentIdStr !== normalizedId) {
        console.error('API returned wrong shipment!', {
          requestedId: normalizedId,
          receivedId: shipmentIdStr,
          shipment: shipment,
        });
        Alert.alert(
          'Error',
          `Mismatch: Requested journey ${normalizedId} but received ${shipmentIdStr}. Please try again.`
        );
        return;
      }
      
      console.log('Shipment data loaded successfully and verified:', {
        requestedId: normalizedId,
        shipmentId: shipment.id,
        fromLocation: shipment.pickupLocation,
        toLocation: shipment.dropLocation,
        status: shipment.status,
      });
      
      // Try to get driver name and broker name from cached journey if API response doesn't include it
      const cachedJourney = journeys.find(j => j.id === normalizedId);
      let driverName = shipment.driverId ? shipment.Driver?.name : undefined;
      let brokerName = shipment.Trucker?.name;
      
      // If driverId exists but Driver name is not in API response, try to get it from cached journey
      if (shipment.driverId && !driverName && cachedJourney?.driverName) {
        driverName = cachedJourney.driverName;
        console.log('Using driver name from cached journey:', driverName);
      }
      
      // If broker name is not in API response, try to get it from cached journey
      if (!brokerName && cachedJourney?.brokerName) {
        brokerName = cachedJourney.brokerName;
        console.log('Using broker name from cached journey:', brokerName);
      }
      
      // Map shipment to journey format
      const mappedJourney = {
        id: shipment.id.toString(),
        clientId: shipment.customerId.toString(),
        clientName: shipment.Customer?.name || t('journeyDetails.unknownClient'),
        driverId: shipment.driverId?.toString() || shipment.truckerId?.toString(),
        driverName: driverName, // Use driver name from API or cached journey
        brokerName: brokerName, // Broker/trucker name who assigned the journey
        vehicleType: shipment.vehicleType,
        loadType: shipment.cargoType,
        fromLocation: shipment.pickupLocation,
        toLocation: shipment.dropLocation,
        status: mapApiStatusToJourneyStatus(shipment.status, shipment.driverId),
        createdAt: shipment.createdAt,
        assignedAt: shipment.status === 'accepted' && shipment.driverId ? shipment.updatedAt : undefined,
        startedAt: ['picked_up', 'in_transit'].includes(shipment.status) ? shipment.updatedAt : undefined,
        completedAt: shipment.status === 'delivered' ? shipment.updatedAt : undefined,
        notes: shipment.description,
        budget: shipment.budget,
        cargoWeight: shipment.cargoWeight,
        cargoSize: shipment.cargoSize,
        // Calculate estimated values based on distance (rough estimates)
        estimatedDuration: calculateEstimatedDuration(shipment.pickupLocation, shipment.dropLocation),
        distance: calculateDistance(shipment.pickupLocation, shipment.dropLocation),
      };
      
      setJourney(mappedJourney);
    } catch (error) {
      console.error('Error loading journey details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load journey details';
      console.error('Error details:', {
        message: errorMessage,
        error,
        id,
      });
      Alert.alert(
        t('dashboard.error'),
        errorMessage || t('journeyDetails.failedToLoadJourneyDetails')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Reload journeys list first
      await reloadJourneys();
      // Then reload the specific journey details with force refresh
      await loadJourneyDetails(true);
    } catch (error) {
      console.error('Error refreshing journey details:', error);
    } finally {
      setRefreshing(false);
    }
  }, [id, reloadJourneys]);

  const mapApiStatusToJourneyStatus = (apiStatus: string, driverId?: number) => {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'confirmed': 'assigned', // Customer confirmed shipment, treat as assigned if driver is assigned
      'accepted': 'assigned',
      'picked_up': 'in_progress',
      'in_transit': 'in_progress',
      'delivered': 'completed',
      'cancelled': 'cancelled',
    };
    let mappedStatus = statusMap[apiStatus] || 'pending';
    
    // If there's no driver assigned, status should be 'pending' (unassigned) 
    // even if API status is 'accepted' or 'confirmed'
    if (!driverId && (mappedStatus === 'assigned' || apiStatus === 'accepted' || apiStatus === 'confirmed')) {
      mappedStatus = 'pending';
    }
    
    return mappedStatus;
  };


  // Transliterate names to Urdu if language is Urdu
  const translateName = (name: string | null | undefined) => {
    if (!name) return name || '';
    if (language === 'ur') {
      // Basic transliteration mapping for common English to Urdu
      const transliterationMap: { [key: string]: string } = {
        'a': 'ا', 'b': 'ب', 'c': 'ک', 'd': 'د', 'e': 'ی', 'f': 'ف',
        'g': 'گ', 'h': 'ہ', 'i': 'ی', 'j': 'ج', 'k': 'ک', 'l': 'ل',
        'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'پ', 'q': 'ق', 'r': 'ر',
        's': 'س', 't': 'ت', 'u': 'و', 'v': 'و', 'w': 'و', 'x': 'کس',
        'y': 'ی', 'z': 'ز'
      };
      
      // Simple transliteration - convert each character
      return name
        .toLowerCase()
        .split('')
        .map(char => transliterationMap[char] || char)
        .join('');
    }
    return name;
  };

  const calculateEstimatedDuration = (from: string, to: string): string => {
    // Simple estimation based on common routes - in real app, use mapping service
    const routeEstimates: Record<string, string> = {
      'new york': '4-6 hours',
      'boston': '4-6 hours',
      'chicago': '6-8 hours',
      'detroit': '5-7 hours',
      'philadelphia': '2-3 hours',
      'washington': '3-4 hours',
    };
    
    const fromKey = from.toLowerCase();
    const toKey = to.toLowerCase();
    
    for (const [key, duration] of Object.entries(routeEstimates)) {
      if (fromKey.includes(key) || toKey.includes(key)) {
        return duration;
      }
    }
    
    return '4-6 hours'; // Default estimate
  };

  const calculateDistance = (from: string, to: string): string => {
    // Simple estimation - in real app, use mapping service
    const distanceEstimates: Record<string, string> = {
      'new york-boston': '215 miles',
      'boston-new york': '215 miles',
      'chicago-detroit': '280 miles',
      'detroit-chicago': '280 miles',
      'new york-philadelphia': '95 miles',
      'philadelphia-new york': '95 miles',
    };
    
    const routeKey = `${from.toLowerCase().split(',')[0]}-${to.toLowerCase().split(',')[0]}`;
    return distanceEstimates[routeKey] || '200-300 miles';
  };

  const handleStartJourney = async () => {
    if (!journey) return;

    // Check location permission before starting journey
    if (!hasPermission) {
      Alert.alert(
        t('journeyDetails.locationPermissionRequired'),
        t('journeyDetails.locationTrackingRequired'),
        [
          { text: t('profile.cancel'), style: 'cancel' },
          { 
            text: t('journeyDetails.grantPermission'), 
            onPress: async () => {
              await requestLocationPermission();
            }
          }
        ]
      );
      return;
    }

    setStartingJourney(true);
    try {
      // Update status to in_transit using driver-specific endpoint
      const response = await apiService.updateDriverShipmentStatus(
        parseInt(journey.id),
        'in_transit'
      );

      // Update local journey state with new data
      const updatedShipment = response.data.shipment;
      const updatedJourney = {
        ...journey,
        status: mapApiStatusToJourneyStatus(updatedShipment.status, updatedShipment.driverId),
        apiStatus: updatedShipment.status,
        startedAt: updatedShipment.updatedAt,
      };
      
      setJourney(updatedJourney);
      
      // Send initial location immediately (foreground)
      await sendLocationNow();

      // Start background tracking to ensure hourly updates even in background
      await startBackgroundLocationTracking(parseInt(journey.id));
      
      Alert.alert(
        t('journeyDetails.journeyStarted'),
        t('journeyDetails.journeyStartedMessage'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting journey:', error);
      Alert.alert(
        t('dashboard.error'),
        error instanceof Error ? error.message : t('journeyDetails.failedToStartJourney')
      );
    } finally {
      setStartingJourney(false);
    }
  };

  const handleCompleteJourney = async () => {
    if (!journey) return;

    setCompletingJourney(true);
    try {
      // Send final location before completing
      await sendLocationNow();
      
      // Update status to delivered using driver-specific endpoint
      const response = await apiService.updateDriverShipmentStatus(
        parseInt(journey.id),
        'delivered'
      );

      // Stop background tracking
      await stopBackgroundLocationTracking();

      // Update local journey state with new data
      const updatedShipment = response.data.shipment;
      const updatedJourney = {
        ...journey,
        status: mapApiStatusToJourneyStatus(updatedShipment.status, updatedShipment.driverId),
        apiStatus: updatedShipment.status,
        completedAt: updatedShipment.updatedAt,
      };
      
      setJourney(updatedJourney);
      
      Alert.alert(
        t('journeyDetails.journeyCompleted'),
        t('journeyDetails.journeyCompletedMessage'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error completing journey:', error);
      Alert.alert(
        t('dashboard.error'),
        error instanceof Error ? error.message : t('journeyDetails.failedToCompleteJourney')
      );
    } finally {
      setCompletingJourney(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!journey) return;

    const destination = encodeURIComponent(journey.toLocation);
    const origin = encodeURIComponent(journey.fromLocation);
    
    // Try to open in Google Maps first, then fallback to Apple Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    const appleMapsUrl = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
    
    Alert.alert(
      t('journeyDetails.openInMapsTitle'),
      t('journeyDetails.choosePreferredMaps'),
      [
        {
          text: t('journeyDetails.googleMaps'),
          onPress: () => Linking.openURL(googleMapsUrl),
        },
        {
          text: t('journeyDetails.appleMaps'),
          onPress: () => Linking.openURL(appleMapsUrl),
        },
        {
          text: t('profile.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/journeys')}>
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('journeyDetails.journeyDetails')}</Text>
        </View>
        <Text style={styles.loadingText}>{t('journeyDetails.loadingJourneyDetails')}</Text>
      </View>
    );
  }

  if (!journey) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/journeys')}>
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('journeyDetails.journeyDetails')}</Text>
        </View>
        <Text style={styles.loadingText}>{t('journeyDetails.journeyNotFound')}</Text>
      </View>
    );
  }

  // Handle type mismatch: compare both as strings to ensure match
  const isAssignedDriver = user?.role === 'driver' && 
    journey.driverId && 
    String(journey.driverId) === String(user.id);

  return (
    <JourneyDetails
      journey={journey}
      isAssignedDriver={isAssignedDriver}
      startingJourney={startingJourney}
      completingJourney={completingJourney}
      refreshing={refreshing}
      isLocationEnabled={isLocationEnabled}
      currentLocation={currentLocation as any}
      onStartJourney={handleStartJourney}
      onCompleteJourney={handleCompleteJourney}
      onOpenInMaps={handleOpenInMaps}
      onRefresh={handleRefresh}
      onBack={() => router.push('/(tabs)/journeys')}
      t={t}
      language={language}
      translateName={translateName}
      estimatedDuration={journey.estimatedDuration || calculateEstimatedDuration(journey.fromLocation, journey.toLocation)}
      distance={journey.distance || calculateDistance(journey.fromLocation, journey.toLocation)}
      userRole={user?.role}
    />
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
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
});