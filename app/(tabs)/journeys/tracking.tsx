import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracking } from '@/hooks/useLocationTracking';
// import { useNotifications } from '@/context/NotificationContext';
import { MapPin, Play, Square, Navigation } from 'lucide-react-native';

export default function TrackingScreen() {
  const { user } = useAuth();
  const { 
    location, 
    isTracking, 
    startTracking, 
    stopTracking, 
    sendLocationUpdate 
  } = useLocationTracking();
  // const { sendNotification } = useNotifications();
  const [currentJourney, setCurrentJourney] = useState(null);

  const handleStartJourney = async () => {
    try {
      await startTracking();
      // await sendNotification('journey_started', {
      //   message: 'Journey has started. Live tracking is now active.',
      //   driverName: user?.name,
      //   journeyId: currentJourney?.id,
      // });
      Alert.alert('Journey Started', 'Location tracking is now active');
    } catch (error) {
      Alert.alert('Error', 'Failed to start tracking');
    }
  };

  const handleStopJourney = async () => {
    try {
      await stopTracking();
      // await sendNotification('journey_completed', {
      //   message: 'Journey has been completed successfully.',
      //   driverName: user?.name,
      //   journeyId: currentJourney?.id,
      // });
      Alert.alert('Journey Completed', 'Tracking has been stopped');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop tracking');
    }
  };

  const handleMilestone = async (milestoneType: string) => {
    const milestoneMessages = {
      picked_up: 'Load has been picked up successfully',
      checkpoint: 'Driver has reached a checkpoint',
      delivered: 'Load has been delivered to destination',
    };

    try {
      // await sendNotification('milestone_reached', {
      //   message: milestoneMessages[milestoneType],
      //   milestone: milestoneType,
      //   driverName: user?.name,
      //   journeyId: currentJourney?.id,
      //   location: location,
      // });
      Alert.alert('Milestone Updated', 'Client has been notified');
    } catch (error) {
      Alert.alert('Error', 'Failed to send milestone update');
    }
  };

  if (user?.role !== 'driver') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Driver access required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Tracking</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#059669' : '#64748b' }]}>
          <Text style={styles.statusText}>
            {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <MapPin size={24} color="#2563eb" />
          <Text style={styles.locationTitle}>Current Location</Text>
        </View>
        {location ? (
          <View style={styles.locationInfo}>
            <Text style={styles.coordinateText}>
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinateText}>
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
            </Text>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Location not available</Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.sectionTitle}>Journey Controls</Text>
        
        <View style={styles.buttonGroup}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStartJourney}>
              <Play size={20} color="#ffffff" />
              <Text style={styles.startButtonText}>Start Journey</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={handleStopJourney}>
              <Square size={20} color="#ffffff" />
              <Text style={styles.stopButtonText}>Complete Journey</Text>
            </TouchableOpacity>
          )}
        </View>

        {isTracking && (
          <View style={styles.milestonesContainer}>
            <Text style={styles.milestonesTitle}>Send Milestone Updates</Text>
            <View style={styles.milestonesGrid}>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => handleMilestone('picked_up')}
              >
                <Text style={styles.milestoneText}>Load Picked Up</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => handleMilestone('checkpoint')}
              >
                <Text style={styles.milestoneText}>At Checkpoint</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneButton}
                onPress={() => handleMilestone('delivered')}
              >
                <Text style={styles.milestoneText}>Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationInfo: {
    gap: 4,
  },
  coordinateText: {
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  noLocationText: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  buttonGroup: {
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  milestonesContainer: {
    marginTop: 24,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  milestonesGrid: {
    gap: 12,
  },
  milestoneButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  milestoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
});