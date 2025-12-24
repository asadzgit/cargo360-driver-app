import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDrivers } from '@/hooks/useDrivers';
import { useJourneys } from '@/hooks/useJourneys';
import { ArrowLeft, Phone, MapPin, User, Clock, Map } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

export default function DriverDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getDriverById } = useDrivers();
  const { journeys } = useJourneys();
  const scrollRef = useScrollToTopOnFocus();

  const driver = getDriverById(id as string);

  const inProgress = useMemo(() =>
    journeys.filter(j => j.driverId === id && (j.status === 'assigned' || j.status === 'in_progress')),
  [journeys, id]);
  const past = useMemo(() =>
    journeys.filter(j => j.driverId === id && (j.status === 'completed' || j.status === 'cancelled')),
  [journeys, id]);

  const handleCall = () => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    }
  };

  const handleLive = () => {
    router.push(`/(tabs)/journeys/live-tracking?driverId=${id}`);
  };

  // Transliterate driver name to Urdu if language is Urdu
  const translateDriverName = (name: string) => {
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

  if (!driver) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('drivers.driver')}</Text>
        </View>
        <Text style={styles.empty}>{t('drivers.driverNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('drivers.driverProfile')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{translateDriverName(driver.name)}</Text>
            <Text style={styles.muted}>ID: {driver.id}</Text>
          </View>
          <View style={getStatusChipStyle(driver.status)}>
            <Text style={styles.statusText}>
              {driver.status === 'active' 
                ? t('drivers.live') 
                : driver.status === 'on_journey' 
                ? t('drivers.onJourney') 
                : t('drivers.offline')}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Phone size={16} color="#64748b" />
          <Text style={styles.infoText}>{driver.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.infoText}>{driver.currentLocation || t('drivers.locationNotAvailable')}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCall}>
            <Phone size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t('drivers.call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLive}>
            <Map size={18} color="#2563eb" />
            <Text style={styles.secondaryBtnText}>{t('drivers.liveLocation')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}> 
        <Text style={styles.sectionTitle}>{t('drivers.inProgress')}</Text>
        {inProgress.length === 0 ? (
          <Text style={styles.muted}>{t('drivers.noInProgressJourneys')}</Text>
        ) : (
          inProgress.map(j => (
            <TouchableOpacity key={j.id} style={styles.journeyItem} onPress={() => router.push(`/(tabs)/journeys/${j.id}`)}>
              <View style={styles.journeyHeader}>
                <Text style={styles.journeyId}>#{j.id}</Text>
                <Text style={getStatusSmallStyle('in_progress')}>{t('drivers.inProgress')}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color="#059669" />
                <Text style={styles.infoText}>{t('dashboard.fromLabel')} {j.fromLocation}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color="#dc2626" />
                <Text style={styles.infoText}>{t('dashboard.toLabel')} {j.toLocation}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('drivers.past')}</Text>
        {past.length === 0 ? (
          <Text style={styles.muted}>{t('drivers.noPastJourneys')}</Text>
        ) : (
          past.map(j => (
            <TouchableOpacity key={j.id} style={styles.journeyItem} onPress={() => router.push(`/(tabs)/journeys/${j.id}`)}>
              <View style={styles.journeyHeader}>
                <Text style={styles.journeyId}>#{j.id}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.mutedSmall}>{new Date(j.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <User size={16} color="#64748b" />
                <Text style={styles.infoText}>{j.loadType} • {j.vehicleType}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Helper functions for dynamic styles
const getStatusChipStyle = (status: string) => ({
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 12,
  backgroundColor: status === 'active' ? '#059669' : status === 'on_journey' ? '#f59e0b' : '#94a3b8'
});

const getStatusSmallStyle = (status: string) => ({
  color: status === 'in_progress' ? '#059669' : '#64748b',
  fontWeight: '600' as const,
  fontSize: 12
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  backButton: { padding: 8, marginRight: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  empty: { textAlign: 'center', marginTop: 100, color: '#64748b' },
  card: { backgroundColor: '#fff', marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  muted: { color: '#64748b' },
  mutedSmall: { color: '#64748b', fontSize: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  infoText: { color: '#1e293b', fontSize: 14 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  primaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#eff6ff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  secondaryBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  journeyItem: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 12, marginTop: 8 },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  journeyId: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
});
