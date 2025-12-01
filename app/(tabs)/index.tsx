import { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useJourneys } from '@/hooks/useJourneys';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Users, Truck, MapPin, Clock, X, Check, RefreshCcw } from 'lucide-react-native';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { drivers, reload: reloadDrivers } = useDrivers();
  const { journeys, reload: reloadJourneys } = useJourneys();
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);

  const isBroker = user?.role === 'trucker';

  // Scroll to top when screen gains focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Refresh both journeys and drivers
      await Promise.all([reloadJourneys(), reloadDrivers()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reloadJourneys, reloadDrivers]);

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeJourneys = journeys.filter(j => j.status === 'in_progress');
  const pendingJourneys = journeys.filter(j => j.status === 'pending');

  // For drivers, filter journeys by their ID and use proper status mapping
  const driverActiveJourneys = journeys.filter(j => 
    j.driverId === user?.id?.toString() && j.status === 'in_progress'
  );
  const driverCompletedJourneys = journeys.filter(j => 
    j.driverId === user?.id?.toString() && j.status === 'completed'
  );

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAssignOrder, setShowAssignOrder] = useState(false);

  // Add Driver modal state
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPhoneError, setDriverPhoneError] = useState('');
  const [addingDriver, setAddingDriver] = useState(false);

  const { addDriver } = useDrivers();

  const handleDriverPhoneChange = (value: string) => {
    setDriverPhone(value);
    // Clear error when user starts typing
    if (driverPhoneError) {
      setDriverPhoneError('');
    }
  };

  const handleAddDriver = async () => {
    if (!driverName || !driverPhone) {
      Alert.alert('Error', 'Please provide driver name and phone number');
      return;
    }

    // Validate phone number
    const validation = validatePakistaniPhone(driverPhone);
    if (!validation.isValid) {
      setDriverPhoneError(validation.error || 'Invalid phone number');
      Alert.alert('Invalid Phone Number', validation.error || 'Please enter a valid Pakistani phone number');
      return;
    }
    setAddingDriver(true);
    try {
      const res: any = await addDriver({ name: driverName, phone: driverPhone });
      const message = res?.message || 'Driver added and OTP sent.';
      Alert.alert('Success', message);
      setShowAddDriver(false);
      setDriverName('');
      setDriverPhone('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add driver.');
    } finally {
      setAddingDriver(false);
    }
  };

  // Assign Order modal state
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | undefined>(undefined);
  const [assigning, setAssigning] = useState(false);

  const unassignedJourneys = useMemo(() =>
    journeys.filter(j => j.status !== 'in_transit' || !j.driverId || j.driverName === 'Unassigned')
  , [journeys]);

  const selectableDrivers = useMemo(() => drivers, [drivers]);

  const { assignDriverToJourney } = useJourneys();
  const handleAssign = async (driverId: string) => {
    if (!selectedJourneyId) {
      Alert.alert('Select journey', 'Please select a journey first');
      return;
    }
    setAssigning(true);
    try {
      await assignDriverToJourney(selectedJourneyId, driverId);
      Alert.alert('Assigned', 'Driver has been assigned to the journey');
      setShowAssignOrder(false);
      setSelectedJourneyId(undefined);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
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
        <Text style={styles.greeting}>
          {isBroker ? 'Broker Dashboard' : 'Driver Dashboard'}
        </Text>
        <Text style={styles.welcomeText}>
          {/* Welcome back, {user?.name} */}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {isBroker ? (
          <>
            {/* <View style={[styles.statCard, styles.primaryCard]}>
              <Users size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{activeDrivers.length}</Text>
              <Text style={styles.statLabel}>Active Drivers</Text>
            </View> */}

            <View style={[styles.statCard, styles.secondaryCard]}>
              <Truck size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{activeJourneys.length}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>

            <View style={[styles.statCard, styles.warningCard]}>
              <Clock size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{pendingJourneys.length}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statCard, styles.secondaryCard]}>
              <Truck size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {driverActiveJourneys.length}
              </Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>

            <View style={[styles.statCard, styles.primaryCard]}>
              <MapPin size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {driverCompletedJourneys.length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </>
        )}
      </View>

      {isBroker && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAddDriver(true)}
            >
              <Users size={24} color="#2563eb" />
              <Text style={styles.actionText}>Add Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAssignOrder(true)}
            >
              <Truck size={24} color="#2563eb" />
              <Text style={styles.actionText}>Assign Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.recentActivity}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            style={styles.refreshInlineButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <RefreshCcw size={16} color="#FFFFFF" />
                <Text style={styles.refreshInlineText}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {journeys.slice(0, 3).map((journey, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.activityItem}
              onPress={() => router.push(`/(tabs)/journeys/${journey.id}`)}
            >
              <View style={styles.activityIcon}>
                <Truck size={16} color={isBroker ? '#2563eb' : '#059669'} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  Order C360-PK-#{journey.id}
                </Text>
                <Text style={styles.activitySubtitle}>
                  {journey.fromLocation} → {journey.toLocation}
                </Text>
                <Text style={styles.activityTime}>Status: {journey.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Driver Bottom Sheet */}
      <Modal visible={showAddDriver} transparent animationType="slide" onRequestClose={() => setShowAddDriver(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAddDriver(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Add New Driver</Text>
              <TouchableOpacity onPress={() => setShowAddDriver(false)}>
                <X size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={driverName}
                  onChangeText={setDriverName}
                  placeholder="Enter driver's full name"
                />
              </View>

              <View>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, driverPhoneError && styles.inputError]}
                  value={driverPhone}
                  onChangeText={handleDriverPhoneChange}
                  placeholder="e.g. 03001234567, 923001234567, or +923001234567"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                {driverPhoneError ? <Text style={styles.errorText}>{driverPhoneError}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, addingDriver && styles.disabledButton]}
                onPress={handleAddDriver}
                disabled={addingDriver}
              >
                <Text style={styles.primaryButtonText}>
                  {addingDriver ? 'Adding Driver...' : 'Add Driver'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assign Order Bottom Sheet */}
      <Modal visible={showAssignOrder} transparent animationType="slide" onRequestClose={() => setShowAssignOrder(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAssignOrder(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Assign Driver</Text>
              <TouchableOpacity onPress={() => setShowAssignOrder(false)}>
                <X size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {!selectedJourneyId && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Select a Journey</Text>
                  {unassignedJourneys.length === 0 ? (
                    <Text style={styles.muted}>No unassigned journeys</Text>
                  ) : (
                    unassignedJourneys.map(j => (
                      <TouchableOpacity key={j.id} style={styles.listItem} onPress={() => setSelectedJourneyId(j.id)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>#{j.id} • {j.loadType}</Text>
                          <View style={styles.inline}>
                            <MapPin size={14} color="#059669" />
                            <Text style={styles.itemSub}>From: {j.fromLocation}</Text>
                          </View>
                          <View style={styles.inline}>
                            <MapPin size={14} color="#dc2626" />
                            <Text style={styles.itemSub}>To: {j.toLocation}</Text>
                          </View>
                        </View>
                        <Check size={18} color="#059669" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {selectedJourneyId && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Select a Driver</Text>
                  {selectableDrivers.length === 0 ? (
                    <Text style={styles.muted}>No drivers found. Add a driver first.</Text>
                  ) : (
                    selectableDrivers.map(d => (
                      <TouchableOpacity key={d.id} style={styles.listItem} disabled={assigning} onPress={() => handleAssign(d.id)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{d.name}</Text>
                          <View style={styles.inline}>
                            <Users size={14} color="#64748b" />
                            <Text style={styles.itemSub}>ID: {d.id} • {d.phone}</Text>
                          </View>
                        </View>
                        <Truck size={18} color="#2563eb" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed8411',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  refreshInlineText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  primaryCard: {
    backgroundColor: '#2563eb',
  },
  secondaryCard: {
    backgroundColor: '#059669',
  },
  warningCard: {
    backgroundColor: '#ea580c',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 8,
    textAlign: 'center',
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetHandle: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#024d9a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 13,
    color: '#64748b',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
});