import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut, User, Building, Phone, MapPin } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Logout called');
              await logout();
            } catch (e) {
              console.error('Logout failed:', e);
            } finally {
              // Route to phone login screen
              router.replace('/auth');
            }
          },
        },
      ]
    );
  };

  const isBroker = user?.role === 'trucker';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#64748b" />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.name}
          </Text>
          {/* <Text style={styles.userRole}>
            {isBroker ? 'Broker' : `Driver • ID: ${user?.driverId}`}
          </Text> */}
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Account Details</Text>
        
        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <User size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phone number</Text>
            <Text style={styles.detailValue}>{user?.phone}</Text>
          </View>
        </View>

        {/* {isBroker ? (
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Building size={20} color="#64748b" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Company</Text>
              <Text style={styles.detailValue}>{user?.companyName}</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Phone size={20} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{user?.phone}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>License</Text>
                <Text style={styles.detailValue}>{user?.licenseNumber}</Text>
              </View>
            </View>
          </>
        )} */}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#64748b',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    gap: 12,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});