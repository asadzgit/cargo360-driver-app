import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '@/services/api';

export default function PhoneSignupScreen() {
  const { phone: phoneParam, role: roleParam } = useLocalSearchParams<{ phone?: string; role?: 'trucker' | 'driver' }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(phoneParam || '');
  const role = (roleParam as 'trucker' | 'driver') || 'driver';
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    if (!name.trim() || !phone) {
      Alert.alert('Missing fields', 'Please enter your name and phone');
      return;
    }
    setLoading(true);
    try {
      await apiService.phoneSignup({ name: name.trim(), phone, role });
      router.replace({ pathname: '/auth/verify-otp', params: { phone } });
    } catch (e: any) {
      Alert.alert('Signup failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <Text style={styles.subtitle}>Create your {role === 'driver' ? 'Driver' : 'Broker'} account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+92XXXXXXXXXX" keyboardType="phone-pad" />
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Please wait...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#ffffff' },
  cta: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
