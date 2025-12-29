import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useJourneys } from '@/hooks/useJourneys';
import { useRouter } from 'expo-router';
import { Plus, Truck, MapPin, Clock, User, RefreshCcw } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

export default function JourneysScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { journeys, reload: reloadJourneys } = useJourneys();
  const router = useRouter();
  const scrollRef = useScrollToTopOnFocus();
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await reloadJourneys();
    } catch (error) {
      console.error('Error refreshing journeys:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reloadJourneys]);

  const isBroker = user?.role === 'trucker';
  const userJourneys = isBroker 
    ? journeys 
    : journeys.filter(j => j.driverId === user?.id?.toString());

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
          {isBroker ? t('journeys.journeyAssignments') : t('journeys.myJourneys')}
        </Text>
        {/* {isBroker && (
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/journeys/assign')}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Assign</Text>
          </TouchableOpacity>
        )} */}
      </View>

      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCcw size={16} color="#ffffff" />
          <Text style={styles.refreshButtonText}>
            {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollRef} 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ed8411']}
            tintColor="#ed8411"
          />
        }
      >
        {userJourneys.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {isBroker ? t('journeys.noOrdersYet') : t('journeys.noOrdersAssigned')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isBroker 
                ? t('journeys.createFirstOrder')
                : t('journeys.waitForAssignments')
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
                  // Always use the same route format for consistency
                  // Use (tabs) prefix to ensure we're in the tabs navigation stack
                  console.log('Navigating to journey from My Journey page:', {
                    journeyId: journey.id,
                    journeyIdType: typeof journey.id,
                    fromLocation: journey.fromLocation,
                    toLocation: journey.toLocation,
                    status: journey.status,
                    driverId: journey.driverId,
                  });
                  router.push(`/(tabs)/journeys/${journey.id}`);
                }}
              >
                <View style={styles.journeyHeader}>
                  <View style={styles.journeyInfo}>
                    <Text style={styles.journeyId}>C360-PK-{journey.id.slice(0, 8)}</Text>
                    <Text style={styles.vehicleType}>{journey.vehicleType}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(journey.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(journey.status)}</Text>
                  </View>
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.locationItem}>
                    <MapPin size={16} color="#059669" />
                    <Text style={styles.locationText}>{t('dashboard.from')}: {journey.fromLocation}</Text>
                  </View>
                  <View style={styles.locationItem}>
                    <MapPin size={16} color="#dc2626" />
                    <Text style={styles.locationText}>{t('dashboard.to')}: {journey.toLocation}</Text>
                  </View>
                </View>

                <View style={styles.journeyFooter}>
                  <View style={styles.footerItem}>
                    <User size={16} color="#64748b" />
                    <Text style={styles.footerText}>
                      {journey.driverName || t('journeys.unassigned')}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.footerText}>
                      {new Date(journey.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {/* {isBroker && journey.status === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.clientLinkButton}
                      onPress={() => {
                        const clientUrl = `${window.location.origin}/client-tracking?journey=${journey.id}`;
                        // Copy to clipboard or share
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
                      <Text style={styles.clientLinkText}>{t('journeys.shareClientLink')}</Text>
                    </TouchableOpacity>
                  )} */}
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed8411',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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