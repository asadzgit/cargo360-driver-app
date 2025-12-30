import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useJourneys } from '@/hooks/useJourneys';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Users, Truck, MapPin, Clock, X, Check, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage(); // Force re-render when language changes
  const { user } = useAuth();
  const { drivers, reload: reloadDrivers, getAvailableDrivers } = useDrivers();
  const { journeys, reload: reloadJourneys } = useJourneys();
  const router = useRouter();
  const scrollRef = useScrollToTopOnFocus();
  const [refreshing, setRefreshing] = useState(false);

  const isBroker = user?.role === 'trucker';

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Reload both drivers and journeys
      await Promise.all([
        reloadDrivers(true), // Force reload
        reloadJourneys(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reloadDrivers, reloadJourneys]);
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeJourneys = journeys.filter(j => j.status === 'in_progress');
  const pendingJourneys = journeys.filter(j => j.status === 'pending');

  const getStatusText = (status: string) => {
    // Return raw status value without translation
    return status;
  };

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
      Alert.alert(t('dashboard.error'), t('dashboard.pleaseProvideDriverNameAndPhone'));
      return;
    }

    // Validate phone number
    const validation = validatePakistaniPhone(driverPhone);
    if (!validation.isValid) {
      setDriverPhoneError(validation.error || t('auth.invalidPhoneNumber'));
      Alert.alert(t('auth.invalidPhoneNumber'), validation.error || t('auth.enterValidPakistaniPhone'));
      return;
    }
    setAddingDriver(true);
    try {
      const res: any = await addDriver({ name: driverName, phone: driverPhone });
      const message = res?.message || t('dashboard.driverAddedAndOTPSent');
      Alert.alert(t('dashboard.success'), message);
      setShowAddDriver(false);
      setDriverName('');
      setDriverPhone('');
    } catch (e: any) {
      Alert.alert(t('dashboard.error'), e?.message || t('dashboard.failedToAddDriver'));
    } finally {
      setAddingDriver(false);
    }
  };

  // Assign Order modal state
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | undefined>(undefined);
  const [assigning, setAssigning] = useState(false);

  // Only show shipments that don't have a driver assigned
  const unassignedJourneys = useMemo(() =>
    journeys.filter(j => !j.driverId || j.driverName === 'Unassigned' || j.driverName === t('journeyDetails.unassigned'))
  , [journeys, t]);

  // Only show drivers who have signed up and verified their account
  const selectableDrivers = useMemo(() => getAvailableDrivers(), [drivers]);

  const { assignDriverToJourney } = useJourneys();
  const handleAssign = async (driverId: string) => {
    if (!selectedJourneyId) {
      Alert.alert(t('dashboard.selectJourney'), t('dashboard.selectJourney'));
      return;
    }
    setAssigning(true);
    try {
      await assignDriverToJourney(selectedJourneyId, driverId);
      Alert.alert(t('dashboard.assigned'), t('dashboard.assigned'));
      setShowAssignOrder(false);
      setSelectedJourneyId(undefined);
    } catch (e: any) {
      Alert.alert(t('dashboard.error'), e?.message || t('dashboard.failedToAssign'));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ScrollView 
      ref={scrollRef} 
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
          {isBroker ? t('dashboard.brokerDashboard') : t('dashboard.driverDashboard')}
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
              <Text style={styles.statLabel}>{t('dashboard.activeOrders')}</Text>
            </View>

            <View style={[styles.statCard, styles.warningCard]}>
              <Clock size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{pendingJourneys.length}</Text>
              <Text style={styles.statLabel}>{t('dashboard.pendingOrders')}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statCard, styles.secondaryCard]}>
              <Truck size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {driverActiveJourneys.length}
              </Text>
              <Text style={styles.statLabel}>{t('dashboard.activeOrders')}</Text>
            </View>

            <View style={[styles.statCard, styles.primaryCard]}>
              <MapPin size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {driverCompletedJourneys.length}
              </Text>
              <Text style={styles.statLabel}>{t('dashboard.completed')}</Text>
            </View>
          </>
        )}
      </View>

      {isBroker && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAddDriver(true)}
            >
              <Users size={24} color="#2563eb" />
              <Text style={styles.actionText}>{t('dashboard.addDriver')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAssignOrder(true)}
            >
              <Truck size={24} color="#2563eb" />
              <Text style={styles.actionText}>{t('dashboard.assignOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.recentActivity}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
          <TouchableOpacity
            style={styles.refreshInlineButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.refreshInlineText}>
              {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {journeys.slice(0, 3).map((journey, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.activityItem}
              onPress={() => {
                console.log('Navigating to journey from Dashboard:', {
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
              <View style={styles.activityIcon}>
                <Truck size={16} color={isBroker ? '#2563eb' : '#059669'} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {t('dashboard.order')} C360-PK-#{journey.id}
                </Text>
                <Text style={styles.activitySubtitle}>
                  <Text style={styles.boldLabel}>{t('dashboard.fromLabel')}</Text> {journey.fromLocation} {' -> '}
                  <Text style={styles.boldLabel}>{t('dashboard.toLabel')}</Text> {journey.toLocation}
                </Text>
                <Text style={styles.activityTime}>
                  <Text style={styles.boldLabel}>{t('dashboard.status')}:</Text> {journey.status}
                </Text>
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
              <Text style={styles.sheetTitle}>{t('dashboard.addNewDriver')}</Text>
              <TouchableOpacity onPress={() => setShowAddDriver(false)}>
                <X size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.label}>{t('auth.fullName')}</Text>
                <TextInput
                  style={styles.input}
                  value={driverName}
                  onChangeText={setDriverName}
                  placeholder={t('dashboard.enterDriversFullName')}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View>
                <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
                <TextInput
                  style={[styles.input, driverPhoneError && styles.inputError]}
                  value={driverPhone}
                  onChangeText={handleDriverPhoneChange}
                  placeholder={t('auth.phonePlaceholderExtended')}
                  placeholderTextColor="#9ca3af"
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
                  {addingDriver ? t('dashboard.addingDriver') : t('dashboard.addDriver')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assign Order Bottom Sheet */}
      <Modal 
        visible={showAssignOrder} 
        transparent 
        animationType="slide" 
        onRequestClose={() => {
          setShowAssignOrder(false);
          setSelectedJourneyId(undefined); // Reset to show shipments list next time
        }}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => {
            setShowAssignOrder(false);
            setSelectedJourneyId(undefined); // Reset to show shipments list next time
          }}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{t('dashboard.assignDriver')}</Text>
              <TouchableOpacity onPress={() => {
                setShowAssignOrder(false);
                setSelectedJourneyId(undefined); // Reset to show shipments list next time
              }}>
                <X size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {!selectedJourneyId && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{t('dashboard.selectAJourney')}</Text>
                  {unassignedJourneys.length === 0 ? (
                    <Text style={styles.muted}>{t('dashboard.noUnassignedJourneys')}</Text>
                  ) : (
                    unassignedJourneys.map(j => (
                      <TouchableOpacity key={j.id} style={styles.listItem} onPress={() => setSelectedJourneyId(j.id)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>#{j.id} • {j.loadType}</Text>
                          <View style={styles.inline}>
                            <MapPin size={14} color="#059669" />
                            <Text style={styles.itemSub}>
                              <Text style={styles.boldLabel}>{t('dashboard.fromLabel')}</Text> {j.fromLocation}
                            </Text>
                          </View>
                          <View style={styles.inline}>
                            <MapPin size={14} color="#dc2626" />
                            <Text style={styles.itemSub}>
                              <Text style={styles.boldLabel}>{t('dashboard.toLabel')}</Text> {j.toLocation}
                            </Text>
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
                  <View style={styles.sectionHeader}>
                    <TouchableOpacity 
                      onPress={() => setSelectedJourneyId(undefined)}
                      style={styles.backButton}
                    >
                      <ArrowLeft size={20} color="#2563eb" />
                    </TouchableOpacity>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('dashboard.selectADriver')}</Text>
                  </View>
                  {selectableDrivers.length === 0 ? (
                    <Text style={styles.muted}>{t('dashboard.noDriversFound')}</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  backButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ed8411',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshInlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  boldLabel: {
    fontWeight: '700',
    color: '#1e293b',
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
    color: '#1e293b',
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
  muted: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});