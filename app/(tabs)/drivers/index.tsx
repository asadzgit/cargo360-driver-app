import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, User, Phone, MapPin, Map, Trash2 } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

export default function DriversScreen() {
  const { user } = useAuth();
  const { drivers, addDriver, removeDriver, reload } = useDrivers();
  const router = useRouter();
  const scrollRef = useScrollToTopOnFocus();

  // Refresh drivers list when screen comes into focus (with debouncing)
  useFocusEffect(
    useCallback(() => {
      // Only reload if not already loading and enough time has passed
      const timeoutId = setTimeout(() => {
        reload();
      }, 500); // Small delay to debounce rapid focus changes
      
      return () => clearTimeout(timeoutId);
    }, [reload])
  );

  if (user?.role !== 'trucker') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Broker access required.</Text>
      </View>
    );
  }

  const handleAddDriver = () => {
    router.push('/drivers/add');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'inactive': return '#64748b';
      case 'on_journey': return '#ea580c';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Available';
      case 'inactive': return 'Offline';
      case 'on_journey': return 'On Journey';
      default: return 'Unknown';
    }
  };

  const handleRemoveDriver = (driverId: string, driverName: string) => {
    Alert.alert(
      'Remove Driver',
      `Are you sure you want to remove ${driverName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDriver(driverId);
              // The list will automatically refresh via useFocusEffect
            } catch (error: any) {
              console.error('Error removing driver:', error);
              const errorMessage = error?.message || error?.error || 'Failed to remove driver. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drivers</Text>
      </View>

      <View style={styles.headerButtons}>
        {/* <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/drivers/map')}>
          <Map size={20} color="#ffffff" />
          <Text style={styles.mapButtonText}>Live Map</Text>
        </TouchableOpacity> */}
         {drivers.length != 0 && 
          <TouchableOpacity style={styles.addButton} onPress={handleAddDriver}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Driver</Text>
          </TouchableOpacity>
        }
      </View>

      <ScrollView ref={scrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {drivers.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Drivers Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first driver to start managing orders
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddDriver}>
              <Text style={styles.emptyButtonText}>Add Driver</Text>
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
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <Text style={styles.driverId}>ID: {driver.driverId}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(driver.status)}</Text>
                  </View>
                </View>

                <View style={styles.driverDetails}>
                  <View style={styles.detailItem}>
                    <Phone size={16} color="#64748b" />
                    <Text style={styles.detailText}>{driver.phone}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      {driver.currentLocation || 'Location not available'}
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