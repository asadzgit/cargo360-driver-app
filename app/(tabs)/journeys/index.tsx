import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useJourneys } from '@/hooks/useJourneys';
import { useRouter } from 'expo-router';
import { Plus, Truck, MapPin, Clock, User } from 'lucide-react-native';

export default function JourneysScreen() {
  const { user } = useAuth();
  const { journeys } = useJourneys();
  const router = useRouter();

  const isBroker = user?.role === 'broker';
  const userJourneys = isBroker 
    ? journeys 
    : journeys.filter(j => j.driverId === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ea580c';
      case 'assigned': return '#2563eb';
      case 'in_progress': return '#059669';
      case 'completed': return '#16a34a';
      case 'cancelled': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Assignment';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isBroker ? 'Journey Assignments' : 'My Journeys'}
        </Text>
        {isBroker && (
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/journeys/assign')}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Assign</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {userJourneys.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {isBroker ? 'No Assignments Yet' : 'No Journeys Assigned'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isBroker 
                ? 'Create your first journey assignment for drivers'
                : 'Wait for journey assignments from your broker'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.journeysList}>
            {userJourneys.map((journey) => (
              <TouchableOpacity
                key={journey.id}
                style={styles.journeyCard}
                onPress={() => {
                  if (isBroker) {
                    router.push(`/(tabs)/journeys/${journey.id}`);
                  } else {
                    // For drivers, go directly to live tracking if assigned
                    if (journey.driverId === user?.id && journey.status !== 'completed') {
                      router.push(`/(tabs)/journeys/live-tracking?journeyId=${journey.id}`);
                    } else {
                      router.push(`/(tabs)/journeys/${journey.id}`);
                    }
                  }
                }}
              >
                <View style={styles.journeyHeader}>
                  <View style={styles.journeyInfo}>
                    <Text style={styles.journeyId}>#{journey.id.slice(0, 8)}</Text>
                    <Text style={styles.vehicleType}>{journey.vehicleType}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(journey.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(journey.status)}</Text>
                  </View>
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.locationItem}>
                    <MapPin size={16} color="#059669" />
                    <Text style={styles.locationText}>From: {journey.fromLocation}</Text>
                  </View>
                  <View style={styles.locationItem}>
                    <MapPin size={16} color="#dc2626" />
                    <Text style={styles.locationText}>To: {journey.toLocation}</Text>
                  </View>
                </View>

                <View style={styles.journeyFooter}>
                  <View style={styles.footerItem}>
                    <User size={16} color="#64748b" />
                    <Text style={styles.footerText}>
                      {journey.driverName || 'Unassigned'}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.footerText}>
                      {new Date(journey.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {isBroker && journey.status === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.clientLinkButton}
                      onPress={() => {
                        const clientUrl = `${window.location.origin}/client-tracking?journey=${journey.id}`;
                        // Copy to clipboard or share
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
                      <Text style={styles.clientLinkText}>Share Client Link</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  journeysList: {
    gap: 16,
  },
  journeyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  journeyInfo: {
    flex: 1,
  },
  journeyId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#64748b',
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
  routeInfo: {
    marginBottom: 12,
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1e293b',
  },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
  clientLinkButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  clientLinkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});