import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '@/services/api';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SetPinScreen() {
  const { phone: phoneParam, resetPin: resetPinParam } = useLocalSearchParams<{ phone?: string; resetPin?: string }>();
  const [phone] = useState(phoneParam || '');
  const [isResetPin] = useState(resetPinParam === 'true');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
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
      if (isResetPin) {
        Alert.alert('Success', 'Your PIN has been reset successfully.', [
          { text: 'OK', onPress: () => router.replace({ pathname: '/auth/enter-pin', params: { phone } }) }
        ]);
      } else {
        router.replace({ pathname: '/auth/enter-pin', params: { phone } });
      }
    } catch (e: any) {
      Alert.alert('Failed to set PIN', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isResetPin ? 'Reset your PIN' : 'Set your PIN'}</Text>
      <Text style={styles.subtitle}>{isResetPin ? 'Enter a new 6-digit PIN' : 'Create a 6-digit PIN for quick login'}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>PIN</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter your PIN"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry={!showPin}
            textAlign="left"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPin(!showPin)}
            activeOpacity={0.7}
          >
            {showPin ? (
              <EyeOff size={20} color="#64748b" />
            ) : (
              <Eye size={20} color="#64748b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm PIN</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm your PIN"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry={!showConfirmPin}
            textAlign="left"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPin(!showConfirmPin)}
            activeOpacity={0.7}
          >
            {showConfirmPin ? (
              <EyeOff size={20} color="#64748b" />
            ) : (
              <Eye size={20} color="#64748b" />
            )}
          </TouchableOpacity>
        </View>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  input: { 
    flex: 1,
    fontSize: 16,
    backgroundColor: 'transparent',
    letterSpacing: 4,
    textAlign: 'left',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cta: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
