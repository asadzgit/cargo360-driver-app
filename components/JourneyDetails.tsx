import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { MapPin, Target, User, Clock, Truck, Navigation, Map, RefreshCcw, ArrowLeft } from 'lucide-react-native';
import { Journey } from '@/types';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface JourneyDetailsProps {
  journey: Journey;
  isAssignedDriver: boolean;
  startingJourney: boolean;
  completingJourney: boolean;
  refreshing: boolean;
  isLocationEnabled: boolean;
  currentLocation: LocationData | null;
  onStartJourney: () => void;
  onCompleteJourney: () => void;
  onOpenInMaps: () => void;
  onRefresh: () => void;
  onBack: () => void;
  t: (key: string) => string;
  language: string;
  translateName: (name: string | null | undefined) => string;
  estimatedDuration: string;
  distance: string;
}

export function JourneyDetails({
  journey,
  isAssignedDriver,
  startingJourney,
  completingJourney,
  refreshing,
  isLocationEnabled,
  currentLocation,
  onStartJourney,
  onCompleteJourney,
  onOpenInMaps,
  onRefresh,
  onBack,
  t,
  language,
  translateName,
  estimatedDuration,
  distance,
}: JourneyDetailsProps) {
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

  return (
    <ScrollView 
      style={styles.container} 
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('journeyDetails.journeyDetails')}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <RefreshCcw size={16} color="#FFFFFF" />
              <Text style={styles.refreshText}>{t('dashboard.refresh')}</Text>
            </>
          )}
        </TouchableOpacity>
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
            <Text style={styles.budgetInfo}>{t('journeyDetails.budget')}: Rs {journey.budget}</Text>
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
            <Text style={styles.statValue}>{distance}</Text>
            <Text style={styles.statLabel}>{t('journeyDetails.distance')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimatedDuration}</Text>
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
              onPress={onStartJourney}
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
              onPress={onCompleteJourney}
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
            onPress={onOpenInMaps}
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed8411',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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

