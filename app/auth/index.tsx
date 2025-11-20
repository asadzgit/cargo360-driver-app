import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiService } from '@/services/api';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function PhoneEntryScreen() {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [role, setRole] = useState<'trucker' | 'driver'>('driver');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleContinue = async () => {
    if (!phone) {
      Alert.alert('Missing phone', 'Please enter your phone number');
      return;
    }

    // Validate phone number
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      Alert.alert('Invalid Phone Number', validation.error || 'Please enter a valid Pakistani phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.checkPhone({ phone, role });
      switch (res.nextStep) {
        case 'signup_required':
          router.push({ pathname: '/auth/phone-signup', params: { phone, role } });
          break;
        case 'verify_otp':
          router.push({ pathname: '/auth/verify-otp', params: { phone } });
          break;
        case 'set_pin':
          router.push({ pathname: '/auth/set-pin', params: { phone } });
          break;
        case 'enter_pin':
          router.push({ pathname: '/auth/enter-pin', params: { phone } });
          break;
        default:
          Alert.alert('Unexpected response', 'Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to check phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in with phone</Text>
      <Text style={styles.subtitle}>Enter your phone to continue</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={[styles.input, phoneError && styles.inputError]}
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="e.g. +923001234567"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      </View>

      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
          onPress={() => setRole('driver')}
        >
          <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'trucker' && styles.roleButtonActive]}
          onPress={() => setRole('trucker')}
        >
          <Text style={[styles.roleText, role === 'trucker' && styles.roleTextActive]}>Broker</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={handleContinue} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Please wait...' : 'Continue'}</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.altLink}>
        <Text style={styles.altText}>Use email/password (broker)</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#ffffff' },
  roleSwitcher: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 16 },
  roleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' },
  roleButtonActive: { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' },
  roleText: { color: '#374151', fontWeight: '500' },
  roleTextActive: { color: '#0ea5e9' },
  cta: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  altLink: { alignItems: 'center', marginTop: 20 },
  altText: { color: '#2563eb' },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
});