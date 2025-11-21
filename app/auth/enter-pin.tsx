import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function EnterPinScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const [phone] = useState(phoneParam || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { phoneLogin } = useAuth();

  const onSubmit = async () => {
    if (pin.length !== 6) {
      Alert.alert('Invalid PIN', 'PIN must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      await phoneLogin(phone, pin);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Enter your 6-digit PIN for {phone}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="••••••"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/auth/forgot-pin')} 
        style={{ alignSelf: 'flex-end', marginTop: 12 }}
      >
        <Text style={{ color: '#059669', fontWeight: '600' }}>Forgot PIN?</Text>
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
  input: { 
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
