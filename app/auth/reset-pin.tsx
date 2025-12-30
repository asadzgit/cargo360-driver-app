import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hash, KeyRound, ArrowLeft } from 'lucide-react-native';
import { apiService } from '@/services/api';

export default function ResetPinScreen() {
  const router = useRouter();
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const [phone] = useState(phoneParam || '');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePin = (p: string) => p && p.length === 6;

  const handleReset = async () => {
    if (!code) {
      Alert.alert('Code required', 'Please enter the verification code sent to your phone.');
      return;
    }
    if (!validatePin(pin)) {
      Alert.alert('Invalid PIN', 'PIN must be 6 digits.');
      return;
    }
    if (pin !== confirm) {
      Alert.alert('Mismatch', 'PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiService.resetPin({ phone, code, pin });
      Alert.alert('Success', 'Your PIN has been reset. Please log in.', [
        { text: 'OK', onPress: () => router.replace({ pathname: '/auth/enter-pin', params: { phone } }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Reset PIN</Text>
        <Text style={styles.subtitle}>Enter the code from your phone and set a new PIN</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Hash size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            keyboardType="number-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputContainer}>
          <KeyRound size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { letterSpacing: 4, textAlign: 'center' }]}
            placeholder="New PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputContainer}>
          <KeyRound size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { letterSpacing: 4, textAlign: 'center' }]}
            placeholder="Confirm new PIN"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Resetting...' : 'Reset PIN'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#059669',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
  form: { paddingHorizontal: 24, marginTop: 16 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    borderWidth: 2, 
    borderColor: '#E5E7EB', 
    height: 48, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: { marginRight: 8, color: '#999999' },
  input: { flex: 1, color: '#333333', fontSize: 16 },
  primaryButton: { 
    backgroundColor: '#059669', 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});

