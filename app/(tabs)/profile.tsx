import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut, User, Building, Phone, MapPin, Mail, Contact, Pencil, Save, X, FileText, Car } from 'lucide-react-native';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';
import { apiService } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const scrollRef = useScrollToTopOnFocus();

  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formVehicleRegistration, setFormVehicleRegistration] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user && !profile) {
      setProfile(user);
      initializeFormFields(user);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: profileData } = await apiService.getProfile();
      setProfile(profileData);
      initializeFormFields(profileData);
    } catch (e) {
      console.error('Failed to load profile:', e);
      if (user) {
        setProfile(user);
        initializeFormFields(user);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeFormFields = (userData: any) => {
    setFormName(userData?.name || '');
    setFormPhone(userData?.phone || '');
    setFormCompany(userData?.company || '');
    setFormCnic(userData?.cnic || '');
    setFormLicense(userData?.license || '');
    setFormVehicleRegistration(userData?.vehicleRegistration || '');
  };

  const handleToggleEdit = () => {
    setUpdateError('');
    setUpdateSuccess('');
    if (!editing) {
      initializeFormFields(profile || user);
    }
    setEditing((v) => !v);
  };

  const handleUpdateProfile = async () => {
    setUpdateError('');
    setUpdateSuccess('');

    const payload: any = {};
    if (formName && formName !== (profile?.name || user?.name || '')) {
      payload.name = formName.trim();
    }
    if (formPhone !== (profile?.phone || user?.phone || '')) {
      payload.phone = formPhone.trim();
    }
    if (formCompany !== (profile?.company || '')) {
      payload.company = formCompany.trim();
    }
    if (formCnic !== (profile?.cnic || '')) {
      payload.cnic = formCnic.trim();
    }
    if (formLicense !== (profile?.license || '')) {
      payload.license = formLicense.trim();
    }
    if (formVehicleRegistration !== (profile?.vehicleRegistration || '')) {
      payload.vehicleRegistration = formVehicleRegistration.trim();
    }

    if (Object.keys(payload).length === 0) {
      setUpdateError('No changes to update.');
      return;
    }

    try {
      setUpdateLoading(true);
      const { user: updatedUser } = await apiService.updateMe(payload);
      setProfile(updatedUser);
      if (setUser) {
        await setUser(updatedUser);
      }
      setEditing(false);
      setUpdateSuccess('Profile updated successfully.');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (e: any) {
      setUpdateError(e?.message || 'Failed to update profile.');
    } finally {
      setUpdateLoading(false);
    }
  };

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
              router.replace('/auth');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayUser = profile || user;

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!editing ? (
          <TouchableOpacity style={styles.editButton} onPress={handleToggleEdit}>
            <Pencil size={18} color="#2563eb" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdateProfile}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleToggleEdit}
              disabled={updateLoading}
            >
              <X size={18} color="#64748b" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {updateError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{updateError}</Text>
        </View>
      ) : null}

      {updateSuccess ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{updateSuccess}</Text>
        </View>
      ) : null}

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#64748b" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayUser?.name}</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Account Details</Text>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <Phone size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phone number</Text>
            {!editing ? (
              <Text style={styles.detailValue}>{displayUser?.phone || '-'}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            )}
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <Building size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Company</Text>
            {!editing ? (
              <Text style={styles.detailValue}>{displayUser?.company || '-'}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={formCompany}
                onChangeText={setFormCompany}
                placeholder="Company name"
              />
            )}
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <FileText size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>CNIC</Text>
            {!editing ? (
              <Text style={styles.detailValue}>{displayUser?.cnic || '-'}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={formCnic}
                onChangeText={setFormCnic}
                placeholder="CNIC number (e.g., 12345-1234567-1)"
              />
            )}
          </View>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <FileText size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>License</Text>
            {!editing ? (
              <Text style={styles.detailValue}>{displayUser?.license || '-'}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={formLicense}
                onChangeText={setFormLicense}
                placeholder="License number"
              />
            )}
          </View>
        </View>

        <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
          <View style={styles.detailIcon}>
            <Car size={20} color="#64748b" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Vehicle Registration No</Text>
            {!editing ? (
              <Text style={styles.detailValue}>{displayUser?.vehicleRegistration || '-'}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={formVehicleRegistration}
                onChangeText={setFormVehicleRegistration}
                placeholder="Vehicle registration number"
              />
            )}
          </View>
        </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  successContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successText: {
    color: '#059669',
    fontSize: 14,
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
  input: {
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
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
