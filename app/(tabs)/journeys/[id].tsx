import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Target, User, Clock, Truck, Navigation, Map } from 'lucide-react-native';
import { useJourneys } from '@/hooks/useJourneys';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { apiService } from '@/services/api';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '@/tasks/locationTrackingTask';

export default function JourneyDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingJourney, setStartingJourney] = useState(false);
  const [completingJourney, setCompletingJourney] = useState(false);
  const { journeys } = useJourneys();

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

  const loadJourneyDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // First try to find the journey in the cached journeys
      const cachedJourney = journeys.find(j => j.id === id);
      if (cachedJourney) {
        // Normalize cached journey to ensure notes field exists
        const normalizedJourney = {
          ...cachedJourney,
          notes: cachedJourney.notes || (cachedJourney as any).description,
        };
        setJourney(normalizedJourney);
        setLoading(false);
        return;
      }

      console.log('Loading journey details for ID:', id);
      // If not found in cache, fetch from API
      const response = await apiService.getShipment(parseInt(id as string));
      console.log('Response:', response.data);
      const shipment = response.data.shipment;
      
      // Map shipment to journey format
      const mappedJourney = {
        id: shipment.id.toString(),
        clientId: shipment.customerId.toString(),
        clientName: shipment.Customer?.name || t('journeyDetails.unknownClient'),
        driverId: shipment.driverId?.toString() || shipment.truckerId?.toString(),
        driverName: shipment.Driver?.name || shipment.Trucker?.name || t('journeyDetails.unassigned'),
        vehicleType: shipment.vehicleType,
        loadType: shipment.cargoType,
        fromLocation: shipment.pickupLocation,
        toLocation: shipment.dropLocation,
        status: mapApiStatusToJourneyStatus(shipment.status),
        createdAt: shipment.createdAt,
        assignedAt: shipment.status === 'accepted' ? shipment.updatedAt : undefined,
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
      // Alert.alert('Error', 'Failed to load journey details');
    } finally {
      setLoading(false);
    }
  };

  const mapApiStatusToJourneyStatus = (apiStatus: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'confirmed': 'assigned', // Customer confirmed shipment, treat as assigned if driver is assigned
      'accepted': 'assigned',
      'picked_up': 'in_progress',
      'in_transit': 'in_progress',
      'delivered': 'completed',
      'cancelled': 'cancelled',
    };
    return statusMap[apiStatus] || 'pending';
  };

  const humanizeStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending Assignment',
      'assigned': 'Assigned to Driver',
      'in_progress': 'In Transit',
      'completed': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
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
        status: mapApiStatusToJourneyStatus(updatedShipment.status),
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
        status: mapApiStatusToJourneyStatus(updatedShipment.status),
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('journeyDetails.journeyDetails')}</Text>
        </View>
        <Text style={styles.loadingText}>{t('journeyDetails.journeyNotFound')}</Text>
      </View>
    );
  }

  const isBroker = user?.role === 'trucker' || user?.role === 'customer';
  // Handle type mismatch: compare both as strings to ensure match
  const isAssignedDriver = user?.role === 'driver' && 
    journey.driverId && 
    String(journey.driverId) === String(user.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('journeyDetails.journeyDetails')}</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <Text style={styles.journeyId}>C360-PK-{journey.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(journey.status) }]}>
            <Text style={styles.statusText}>{humanizeStatus(journey.status)}</Text>
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{translateName(journey.clientName)}</Text>
          <Text style={styles.loadInfo}>{journey.loadType} • {journey.vehicleType}</Text>
          {journey.budget && (
            <Text style={styles.budgetInfo}>{t('journeyDetails.budget')}: ${journey.budget}</Text>
          )}
        </View>
      </View>

      <View style={styles.routeCard}>
        <Text style={styles.sectionTitle}>{t('journeyDetails.routeInformation')}</Text>
        
        <View style={styles.routeDetails}>
          <View style={styles.locationItem}>
            <MapPin size={20} color="#059669" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{t('journeyDetails.pickupLocation')}</Text>
              <Text style={styles.locationValue}>{journey.fromLocation}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.locationItem}>
            <Target size={20} color="#dc2626" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{t('journeyDetails.deliveryLocation')}</Text>
              <Text style={styles.locationValue}>{journey.toLocation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{journey.distance}</Text>
            <Text style={styles.statLabel}>{t('journeyDetails.distance')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{journey.estimatedDuration}</Text>
            <Text style={styles.statLabel}>{t('journeyDetails.estDuration')}</Text>
          </View>
          {journey.cargoWeight && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journey.cargoWeight}kg</Text>
              <Text style={styles.statLabel}>{t('journeyDetails.weight')}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.assignmentCard}>
        <Text style={styles.sectionTitle}>{t('journeyDetails.assignmentDetails')}</Text>
        
        <View style={styles.assignmentInfo}>
          <View style={styles.infoRow}>
            <User size={16} color="#64748b" />
            <Text style={styles.infoLabel}>{t('journeyDetails.driver')}</Text>
            <Text style={styles.infoValue}>{translateName(journey.driverName)}</Text>
          </View>
          
          {journey.assignedAt && (
            <View style={styles.infoRow}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.infoLabel}>{t('journeyDetails.assigned')}</Text>
              <Text style={styles.infoValue}>
                {new Date(journey.assignedAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Truck size={16} color="#64748b" />
            <Text style={styles.infoLabel}>{t('journeyDetails.vehicle')}</Text>
            <Text style={styles.infoValue}>{journey.vehicleType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoLabel}>{t('journeyDetails.created')}</Text>
            <Text style={styles.infoValue}>
              {new Date(journey.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {(journey.notes || (journey as any).description) && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>{t('journeyDetails.description')}</Text>
            <Text style={styles.notesText}>{translateName(journey.notes || (journey as any).description)}</Text>
          </View>
        )}
      </View>

      {isAssignedDriver && (
        <View style={styles.actionContainer}>
          {journey.status === 'assigned' && (
            <TouchableOpacity 
              style={[styles.startJourneyButton, startingJourney && styles.disabledButton]} 
              onPress={handleStartJourney}
              disabled={startingJourney}
            >
              <Navigation size={20} color="#ffffff" />
              <Text style={styles.startJourneyButtonText}>
                {startingJourney ? t('journeyDetails.startingJourney') : t('journeyDetails.startJourney')}
              </Text>
            </TouchableOpacity>
          )}

          {journey.status === 'in_progress' && (
            <TouchableOpacity 
              style={[styles.completeJourneyButton, completingJourney && styles.disabledButton]} 
              onPress={handleCompleteJourney}
              disabled={completingJourney}
            >
              <Target size={20} color="#ffffff" />
              <Text style={styles.completeJourneyButtonText}>
                {completingJourney ? t('journeyDetails.completingJourney') : t('journeyDetails.completeJourney')}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.mapsButton} 
            onPress={handleOpenInMaps}
          >
            <Map size={20} color="#2563eb" />
            <Text style={styles.mapsButtonText}>{t('journeyDetails.openInMaps')}</Text>
          </TouchableOpacity>
          
          {/* Location tracking status */}
          {journey.status === 'in_progress' && (
            <View style={styles.trackingStatus}>
              <View style={[styles.trackingIndicator, { backgroundColor: isLocationEnabled ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.trackingStatusText}>
                {t('journeyDetails.gpsTracking')} {isLocationEnabled ? t('journeyDetails.active') : t('journeyDetails.inactive')}
              </Text>
              {currentLocation && (
                <Text style={styles.lastLocationText}>
                  {t('journeyDetails.lastUpdate')} {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
          
          <Text style={styles.actionNote}>
            {journey.status === 'assigned' 
              ? t('journeyDetails.startJourneyNote')
              : journey.status === 'in_progress'
              ? t('journeyDetails.gpsTrackingActiveNote')
              : t('journeyDetails.useMapsForNavigation')
            }
          </Text>
        </View>
      )}

      {isBroker && (
        <View style={styles.adminActions}>
          <Text style={styles.sectionTitle}>{t('journeyDetails.adminActions')}</Text>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => router.push(`/(tabs)/journeys/client-view?journeyId=${journey.id}`)}
          >
            <Text style={styles.adminButtonText}>{t('journeyDetails.previewClientView')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminButton}>
            <Text style={styles.adminButtonText}>{t('journeyDetails.contactDriver')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => {
              const clientUrl = `/client-tracking?journey=${journey.id}`;
              if (navigator.share) {
                navigator.share({
                  title: t('journeys.trackYourDelivery'),
                  text: t('journeys.trackDeliveryRealTime'),
                  url: clientUrl,
                });
              } else {
                navigator.clipboard.writeText(clientUrl);
                Alert.alert(t('journeys.linkCopied'), t('journeys.clientTrackingLinkCopied'));
              }
            }}
          >
            <Text style={styles.shareButtonText}>{t('journeyDetails.shareClientTrackingLink')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'assigned': return '#2563eb';
    case 'in_progress': return '#059669';
    case 'completed': return '#10b981';
    case 'cancelled': return '#dc2626';
    default: return '#64748b';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
  journeyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  clientInfo: {
    gap: 4,
  },
  clientName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  budgetInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  routeCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  routeDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginLeft: 10,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
  assignmentCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignmentInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
  },
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  startJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  startJourneyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  completeJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  completeJourneyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  mapsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  adminActions: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adminButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adminButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  trackingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trackingStatusText: {
    fontSize: 14,
    color: '#64748b',
  },
  lastLocationText: {
    fontSize: 14,
    color: '#64748b',
  },
});