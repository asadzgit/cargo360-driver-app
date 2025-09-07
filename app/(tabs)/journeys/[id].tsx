import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Target, User, Clock, Truck, Navigation } from 'lucide-react-native';

export default function JourneyDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [journey, setJourney] = useState(null);

  useEffect(() => {
    // Mock journey data - in real app, fetch from API
    const mockJourney = {
      id: id,
      clientName: 'ABC Logistics',
      driverId: user?.role === 'driver' ? user.id : 'driver-1',
      driverName: user?.role === 'driver' ? user.name : 'John Smith',
      vehicleType: 'Medium Truck',
      loadType: 'Electronics',
      fromLocation: 'New York, NY',
      toLocation: 'Boston, MA',
      status: 'assigned',
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      notes: 'Handle with care - fragile electronics',
      estimatedDuration: '4.5 hours',
      distance: '215 miles',
    };
    setJourney(mockJourney);
  }, [id]);

  const handleStartLiveTracking = () => {
    router.push(`/journeys/live-tracking?journeyId=${id}`);
  };

  if (!journey) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading journey details...</Text>
      </View>
    );
  }

  const isBroker = user?.role === 'broker';
  const isAssignedDriver = user?.role === 'driver' && journey.driverId === user.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>Journey Details</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <Text style={styles.journeyId}>#{journey.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{journey.status}</Text>
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{journey.clientName}</Text>
          <Text style={styles.loadInfo}>{journey.loadType} • {journey.vehicleType}</Text>
        </View>
      </View>

      <View style={styles.routeCard}>
        <Text style={styles.sectionTitle}>Route Information</Text>
        
        <View style={styles.routeDetails}>
          <View style={styles.locationItem}>
            <MapPin size={20} color="#059669" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationValue}>{journey.fromLocation}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.locationItem}>
            <Target size={20} color="#dc2626" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Delivery Location</Text>
              <Text style={styles.locationValue}>{journey.toLocation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{journey.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{journey.estimatedDuration}</Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </View>
        </View>
      </View>

      <View style={styles.assignmentCard}>
        <Text style={styles.sectionTitle}>Assignment Details</Text>
        
        <View style={styles.assignmentInfo}>
          <View style={styles.infoRow}>
            <User size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Driver:</Text>
            <Text style={styles.infoValue}>{journey.driverName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Assigned:</Text>
            <Text style={styles.infoValue}>
              {new Date(journey.assignedAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Truck size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Vehicle:</Text>
            <Text style={styles.infoValue}>{journey.vehicleType}</Text>
          </View>
        </View>

        {journey.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Special Instructions</Text>
            <Text style={styles.notesText}>{journey.notes}</Text>
          </View>
        )}
      </View>

      {isAssignedDriver && journey.status === 'assigned' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.trackingButton} 
            onPress={handleStartLiveTracking}
          >
            <Navigation size={20} color="#ffffff" />
            <Text style={styles.trackingButtonText}>Start Live Tracking</Text>
          </TouchableOpacity>
          <Text style={styles.trackingNote}>
            This will share your real-time location with the admin dashboard
          </Text>
        </View>
      )}

      {isBroker && (
        <View style={styles.adminActions}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => router.push(`/(tabs)/journeys/client-view?journeyId=${journey.id}`)}
          >
            <Text style={styles.adminButtonText}>Preview Client View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminButton}>
            <Text style={styles.adminButtonText}>Contact Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => {
              const clientUrl = `/client-tracking?journey=${journey.id}`;
              if (navigator.share) {
                navigator.share({
                  title: 'Track Your Delivery',
                  text: 'Track your delivery in real-time',
                  url: clientUrl,
                });
              } else {
                navigator.clipboard.writeText(clientUrl);
                Alert.alert('Link Copied', 'Client tracking link copied to clipboard');
              }
            }}
          >
            <Text style={styles.shareButtonText}>Share Client Tracking Link</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

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
    backgroundColor: '#2563eb',
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
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  trackingButtonText: {
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
});