import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useJourneys } from '@/hooks/useJourneys';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, Users, Truck, Clock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface DriverLocation {
  driverId: string;
  driverName: string;
  location: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  };
  journey?: {
    id: string;
    fromLocation: string;
    toLocation: string;
    clientName: string;
    progress: number;
  };
  lastUpdate: Date;
}

export default function DriversMapScreen() {
  const { user } = useAuth();
  const { drivers } = useDrivers();
  const { journeys } = useJourneys();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [driverLocations, setDriverLocations] = useState<Map<string, DriverLocation>>(new Map());
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

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

  useEffect(() => {
    if (user?.role !== 'broker') return;
    
    // Simulate receiving live driver locations
    const interval = setInterval(() => {
      simulateDriverLocations();
    }, 5000);

    // Initial load
    simulateDriverLocations();

    return () => clearInterval(interval);
  }, [drivers, journeys]);

  const simulateDriverLocations = () => {
    const activeDrivers = drivers.filter(d => d.status === 'active' || d.status === 'on_journey');
    const newLocations = new Map<string, DriverLocation>();

    activeDrivers.forEach((driver, index) => {
      const activeJourney = journeys.find(j => j.driverId === driver.id && j.status === 'in_progress');
      
      // Generate mock coordinates around different cities
      const baseLat = 40.7128 + (index * 2);
      const baseLng = -74.0060 + (index * 2);
      
      const location: DriverLocation = {
        driverId: driver.id,
        driverName: driver.name,
        location: {
          latitude: baseLat + (Math.random() - 0.5) * 0.1,
          longitude: baseLng + (Math.random() - 0.5) * 0.1,
          speed: 50 + Math.random() * 30,
          heading: Math.random() * 360,
        },
        journey: activeJourney ? {
          id: activeJourney.id,
          fromLocation: activeJourney.fromLocation,
          toLocation: activeJourney.toLocation,
          clientName: 'Client Name', // Would come from client data
          progress: 30 + Math.random() * 40,
        } : undefined,
        lastUpdate: new Date(),
      };

      newLocations.set(driver.id, location);
    });

    setDriverLocations(newLocations);
  };

  const centerMapOnDrivers = () => {
    if (driverLocations.size === 0 || !mapRef.current || !mapComponents) return;

    const coordinates = Array.from(driverLocations.values()).map(driver => ({
      latitude: driver.location.latitude,
      longitude: driver.location.longitude,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
  };

  const getDriverStatusColor = (driver: DriverLocation) => {
    if (!driver.journey) return '#64748b'; // Inactive
    if (driver.journey.progress < 25) return '#ef4444'; // Just started
    if (driver.journey.progress < 75) return '#f59e0b'; // In progress
    return '#10b981'; // Almost done
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriver(selectedDriver === driverId ? null : driverId);
    
    const driver = driverLocations.get(driverId);
    if (driver && mapRef.current && mapComponents) {
      mapRef.current.animateToRegion({
        latitude: driver.location.latitude,
        longitude: driver.location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    }
  };

  if (user?.role !== 'broker') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Broker access required</Text>
      </View>
    );
  }

  const selectedDriverData = selectedDriver ? driverLocations.get(selectedDriver) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>Live Driver Map</Text>
        <TouchableOpacity style={styles.centerMapButton} onPress={centerMapOnDrivers}>
          <Navigation size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Users size={16} color="#2563eb" />
          <Text style={styles.statText}>{driverLocations.size} Active</Text>
        </View>
        <View style={styles.statItem}>
          <Truck size={16} color="#059669" />
          <Text style={styles.statText}>
            {Array.from(driverLocations.values()).filter(d => d.journey).length} On Journey
          </Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color="#f59e0b" />
          <Text style={styles.statText}>Live Updates</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' || !mapComponents ? (
          <View style={[styles.map, styles.webMapPlaceholder]}>
            <Truck size={48} color="#64748b" />
            <Text style={styles.webMapText}>
              {Platform.OS === 'web' ? 'Driver map available on mobile devices' : 'Loading map...'}
            </Text>
            <Text style={styles.webMapSubtext}>
              {Platform.OS === 'web' 
                ? 'Use Expo Go or a development build to see live driver locations'
                : 'Please wait while the map loads'
              }
            </Text>
          </View>
        ) : (
          <mapComponents.MapView
            ref={mapRef}
            style={styles.map}
            provider={mapComponents.PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 40.7128,
              longitude: -74.0060,
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
            showsTraffic={true}
            showsMyLocationButton={false}
          >
            {Array.from(driverLocations.values()).map((driver) => (
              <mapComponents.Marker
                key={driver.driverId}
                coordinate={driver.location}
                onPress={() => handleDriverSelect(driver.driverId)}
              >
                <View style={[
                  styles.driverMarker,
                  { borderColor: getDriverStatusColor(driver) }
                ]}>
                  <Truck size={16} color={getDriverStatusColor(driver)} />
                </View>
              </mapComponents.Marker>
            ))}

            {/* Show route for selected driver */}
            {selectedDriverData?.journey && (
              <mapComponents.Polyline
                coordinates={[
                  selectedDriverData.location,
                  // Mock destination coordinates
                  { latitude: selectedDriverData.location.latitude + 0.5, longitude: selectedDriverData.location.longitude + 0.5 }
                ]}
                strokeColor="#2563eb"
                strokeWidth={3}
                strokePattern={[10, 5]}
              />
            )}
          </mapComponents.MapView>
        )}
      </View>

      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.bottomPanelContent}>
        {selectedDriverData ? (
          <View style={styles.driverDetailsCard}>
            <View style={styles.driverHeader}>
              <Text style={styles.driverName}>{selectedDriverData.driverName}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedDriver(null)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedDriverData.journey ? (
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyTitle}>Active Journey</Text>
                <View style={styles.journeyDetails}>
                  <Text style={styles.journeyRoute}>
                    {selectedDriverData.journey.fromLocation} → {selectedDriverData.journey.toLocation}
                  </Text>
                  <Text style={styles.journeyClient}>
                    Client: {selectedDriverData.journey.clientName}
                  </Text>
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Progress: {selectedDriverData.journey.progress.toFixed(1)}%</Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${selectedDriverData.journey.progress}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.noJourneyText}>Driver is available but not on a journey</Text>
            )}

            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Location</Text>
              <View style={styles.locationDetails}>
                <Text style={styles.coordinateText}>
                  {selectedDriverData.location.latitude.toFixed(6)}, {selectedDriverData.location.longitude.toFixed(6)}
                </Text>
                {selectedDriverData.location.speed && (
                  <Text style={styles.speedText}>
                    Speed: {(selectedDriverData.location.speed * 3.6).toFixed(1)} km/h
                  </Text>
                )}
                <Text style={styles.updateTime}>
                  Last update: {selectedDriverData.lastUpdate.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.driversListCard}>
            <Text style={styles.driversListTitle}>Active Drivers</Text>
            <View style={styles.driversList}>
              {Array.from(driverLocations.values()).map((driver) => (
                <TouchableOpacity
                  key={driver.driverId}
                  style={styles.driverListItem}
                  onPress={() => handleDriverSelect(driver.driverId)}
                >
                  <View style={styles.driverListInfo}>
                    <Text style={styles.driverListName}>{driver.driverName}</Text>
                    <Text style={styles.driverListStatus}>
                      {driver.journey ? `On journey - ${driver.journey.progress.toFixed(1)}% complete` : 'Available'}
                    </Text>
                  </View>
                  <View style={[
                    styles.driverListIndicator,
                    { backgroundColor: getDriverStatusColor(driver) }
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
  centerMapButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  mapContainer: {
    height: height * 0.5,
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomPanelContent: {
    padding: 16,
  },
  driverDetailsCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
  },
  journeyInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  journeyDetails: {
  },
  journeyRoute: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  journeyClient: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  noJourneyText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  locationInfo: {
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationDetails: {
  },
  coordinateText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#1e293b',
    fontWeight: '500',
  },
  speedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  updateTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  driversListCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driversListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  driversList: {
  },
  driverListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  driverListInfo: {
    flex: 1,
  },
  driverListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverListStatus: {
    fontSize: 14,
    color: '#64748b',
  },
  driverListIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
});