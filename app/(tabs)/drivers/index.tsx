import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, User, Phone, MapPin, Map, Trash2 } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

export default function DriversScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { drivers, addDriver, removeDriver, reload } = useDrivers();
  const router = useRouter();
  const scrollRef = useScrollToTopOnFocus();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh drivers list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload drivers when screen is focused to ensure latest list is shown
      const timeoutId = setTimeout(() => {
        reload();
      }, 300); // Small delay to debounce rapid focus changes

      return () => clearTimeout(timeoutId);
    }, [reload])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await reload(true); // Force reload
    } catch (error) {
      console.error('Error refreshing drivers:', error);
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  if (user?.role !== 'trucker') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('drivers.accessDenied')}</Text>
      </View>
    );
  }

  const handleAddDriver = () => {
    router.push('/drivers/add');
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'active': return '#059669';
  //     case 'inactive': return '#64748b';
  //     case 'on_journey': return '#ea580c';
  //     default: return '#64748b';
  //   }
  // };

  // const getStatusText = (status: string) => {
  //   switch (status) {
  //     case 'active': return t('drivers.available');
  //     case 'inactive': return t('drivers.offline');
  //     case 'on_journey': return t('drivers.onJourney');
  //     default: return t('drivers.unknown');
  //   }
  // };

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

  const handleRemoveDriver = (driverId: string, driverName: string) => {
    Alert.alert(
      t('drivers.removeDriver'),
      t('drivers.areYouSureRemoveDriver', { name: driverName }),
      [
        {
          text: t('drivers.cancel'),
          style: 'cancel',
        },
        {
          text: t('drivers.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDriver(driverId);
              // The list will automatically refresh via useFocusEffect
            } catch (error: any) {
              console.error('Error removing driver:', error);
              const errorMessage = error?.message || error?.error || t('drivers.failedToRemoveDriver');
              Alert.alert(t('dashboard.error'), errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('drivers.drivers')}</Text>
      </View>

      <View style={styles.headerButtons}>
        {/* <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/drivers/map')}>
          <Map size={20} color="#ffffff" />
          <Text style={styles.mapButtonText}>Live Map</Text>
        </TouchableOpacity> */}
         {drivers.length != 0 && 
          <TouchableOpacity style={styles.addButton} onPress={handleAddDriver}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>{t('drivers.addDriver')}</Text>
          </TouchableOpacity>
        }
      </View>

      <ScrollView 
        ref={scrollRef} 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {drivers.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t('drivers.noDriversYet')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('drivers.addYourFirstDriver')}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddDriver}>
              <Text style={styles.emptyButtonText}>{t('drivers.addDriver')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.driversList}>
            {drivers.map((driver) => (
              <View key={driver.id} style={styles.driverCard}>
              <TouchableOpacity
                  style={styles.driverCardContent}
                onPress={() => router.push(`/drivers/${driver.id}`)}
              >
                <View style={styles.driverHeader}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{translateDriverName(driver.name)}</Text>
                    <Text style={styles.driverId}>ID: {driver.driverId}</Text>
                  </View>
                  {/* <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(driver.status)}</Text>
                  </View> */}
                </View>

                <View style={styles.driverDetails}>
                  <View style={styles.detailItem}>
                    <Phone size={16} color="#64748b" />
                    <Text style={styles.detailText}>{driver.phone}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      {driver.currentLocation || t('drivers.locationNotAvailable')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveDriver(driver.id, driver.name)}
                >
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor:'#024d9a',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#024d9a',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  driversList: {
    gap: 16,
  },
  driverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  driverCardContent: {
    flex: 1,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverId: {
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
  driverDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    backgroundColor: '#fef2f2',
  },
});