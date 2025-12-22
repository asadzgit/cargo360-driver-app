import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useJourneys } from '@/hooks/useJourneys';
import { useDrivers } from '@/hooks/useDrivers';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, User, MapPin, Truck, Check } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

export default function AssignDriverScreen() {
  const { journeyId: qpJourneyId } = useLocalSearchParams<{ journeyId?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { journeys, assignDriverToJourney } = useJourneys();
  const { drivers, reload: reloadDrivers, getAvailableDrivers } = useDrivers();
  const scrollRef = useScrollToTopOnFocus();

  const isBroker = user?.role === 'trucker';
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | undefined>(qpJourneyId);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isBroker) {
      Alert.alert('Access denied', 'Only brokers can assign drivers');
      router.back();
    }
  }, [isBroker]);

  // Refresh drivers list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload drivers when screen is focused to ensure latest list is shown
      const timeoutId = setTimeout(() => {
        reloadDrivers();
      }, 300); // Small delay to debounce rapid focus changes
      
      return () => clearTimeout(timeoutId);
    }, [reloadDrivers])
  );

  // Only show shipments that don't have a driver assigned
  const unassignedJourneys = useMemo(() =>
    journeys.filter(j => !j.driverId),
  [journeys]);

  // Only show drivers who have signed up and verified their account
  const selectableDrivers = useMemo(() => getAvailableDrivers(), [drivers]);

  const handleAssign = async (driverId: string) => {
    if (!selectedJourneyId) {
      Alert.alert('Select journey', 'Please select a journey first');
      return;
    }
    setAssigning(true);
    try {
      await assignDriverToJourney(selectedJourneyId, driverId);
      Alert.alert('Assigned', 'Driver has been assigned to the journey', [
        { text: 'OK', onPress: () => router.replace(`/(tabs)/journeys/${selectedJourneyId}`) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Assign Driver</Text>
      </View>

      {/* Step 1: choose journey if not provided */}
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

      {/* Step 2: choose driver */}
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
                    <User size={14} color="#64748b" />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, 
        backgroundColor:'#024d9a',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 10,
  },
  backButton: { padding: 8, marginRight: 16, color: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  muted: { color: '#64748b' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  itemSub: { fontSize: 12, color: '#64748b' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
