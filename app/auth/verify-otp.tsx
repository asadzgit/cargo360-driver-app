import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '@/services/api';

export default function VerifyOtpScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const [phone] = useState(phoneParam || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const onVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.verifyOtp({ phone, otp });
      if (res.nextStep === 'enter_pin') {
        router.replace({ pathname: '/auth/enter-pin', params: { phone } });
      } else {
        router.replace({ pathname: '/auth/set-pin', params: { phone } });
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await apiService.resendOtp({ phone });
      Alert.alert('OTP resent', 'A new OTP has been sent to your phone');
    } catch (e: any) {
      Alert.alert('Failed to resend', e?.message || 'Please try again');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>OTP</Text>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={onVerify} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resend} onPress={onResend} disabled={resending}>
        <Text style={styles.resendText}>{resending ? 'Resending...' : 'Resend OTP'}</Text>
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
  cta: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  resend: { alignItems: 'center', marginTop: 16 },
  resendText: { color: '#2563eb' },
});
