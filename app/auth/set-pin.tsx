import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '@/services/api';

export default function SetPinScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const [phone] = useState(phoneParam || '');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    if (pin.length !== 6 || confirm.length !== 6) {
      Alert.alert('Invalid PIN', 'PIN must be 6 digits');
      return;
    }
    if (pin !== confirm) {
      Alert.alert('Mismatch', 'PIN and confirmation must match');
      return;
    }

    setLoading(true);
    try {
      await apiService.setPin({ phone, pin });
      router.replace({ pathname: '/auth/enter-pin', params: { phone } });
    } catch (e: any) {
      Alert.alert('Failed to set PIN', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set your PIN</Text>
      <Text style={styles.subtitle}>Create a 6-digit PIN for quick login</Text>

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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Saving...' : 'Save PIN'}</Text>
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
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#ffffff', letterSpacing: 4, textAlign: 'center' },
  cta: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
