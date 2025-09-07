import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useDrivers } from '@/hooks/useDrivers';
import { useJourneys } from '@/hooks/useJourneys';
import { Users, Truck, MapPin, Clock } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { drivers } = useDrivers();
  const { journeys } = useJourneys();

  const isBroker = user?.role === 'broker';

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeJourneys = journeys.filter(j => j.status === 'in_progress');
  const pendingJourneys = journeys.filter(j => j.status === 'pending');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {isBroker ? 'Broker Dashboard' : 'Driver Dashboard'}
        </Text>
        <Text style={styles.welcomeText}>
          Welcome back, {isBroker ? user?.companyName : user?.name}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {isBroker ? (
          <>
            <View style={[styles.statCard, styles.primaryCard]}>
              <Users size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{activeDrivers.length}</Text>
              <Text style={styles.statLabel}>Active Drivers</Text>
            </View>

            <View style={[styles.statCard, styles.secondaryCard]}>
              <Truck size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{activeJourneys.length}</Text>
              <Text style={styles.statLabel}>Active Journeys</Text>
            </View>

            <View style={[styles.statCard, styles.warningCard]}>
              <Clock size={32} color="#ffffff" />
              <Text style={styles.statNumber}>{pendingJourneys.length}</Text>
              <Text style={styles.statLabel}>Pending Assignments</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statCard, styles.secondaryCard]}>
              <Truck size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {journeys.filter(j => j.driverId === user?.id && j.status === 'in_progress').length}
              </Text>
              <Text style={styles.statLabel}>Active Journey</Text>
            </View>

            <View style={[styles.statCard, styles.primaryCard]}>
              <MapPin size={32} color="#ffffff" />
              <Text style={styles.statNumber}>
                {journeys.filter(j => j.driverId === user?.id && j.status === 'completed').length}
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
            <TouchableOpacity style={styles.actionCard}>
              <Users size={24} color="#2563eb" />
              <Text style={styles.actionText}>Add Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Truck size={24} color="#2563eb" />
              <Text style={styles.actionText}>Assign Journey</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {journeys.slice(0, 3).map((journey, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Truck size={16} color={isBroker ? '#2563eb' : '#059669'} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  Journey {journey.id.slice(0, 8)}
                </Text>
                <Text style={styles.activitySubtitle}>
                  {journey.fromLocation} → {journey.toLocation}
                </Text>
                <Text style={styles.activityTime}>Status: {journey.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
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
});