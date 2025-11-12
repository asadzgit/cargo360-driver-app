import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut, User, Building, Phone, MapPin, Mail, Contact } from 'lucide-react-native';

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
              router.replace('/auth/login');
            }
          },
        },
      ]
    );
  };

  const isBroker = user?.role === 'trucker';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#64748b" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
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

        {/* Additional details can go here */}
      </View>

      {/* Support Section */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Contact Support</Text>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('mailto:info@cargo360pk.com')}
        >
          <Mail size={20} color="#64748B" />
          <Text style={styles.supportLinkTextNoDecoration}>info@cargo360pk.com</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('tel:923337766609')}
        >
          <Phone size={20} color="#64748B" />
          <Text style={styles.supportLinkTextNoDecoration}>92 333 7766609</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          onPress={() => Linking.openURL('https://cargo360pk.com/privacy-policy')}
        >
          <Contact size={20} color="#64748B" />
          <Text style={styles.supportLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom footer */}
      <View style={styles.footerBottom}>
        <Text style={styles.supportText}>© 2025 CARGO 360. All rights reserved.</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 24,
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
    marginTop: 24,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  supportSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingLeft: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  supportLinkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  supportLinkTextNoDecoration: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  supportText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  footerBottom: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 16,
  },
});
