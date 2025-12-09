import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '@/services/api';

export default function VerifyOtpScreen() {
  const { phone: phoneParam, resetPin: resetPinParam } = useLocalSearchParams<{ phone?: string; resetPin?: string }>();
  const [phone] = useState(phoneParam || '');
  const [isResetPin] = useState(resetPinParam === 'true');
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
      // If this is a PIN reset flow, always go to set-pin screen with resetPin flag
      if (isResetPin) {
        router.replace({ pathname: '/auth/set-pin', params: { phone, resetPin: 'true' } });
      } else if (res.nextStep === 'enter_pin') {
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
      <Text style={styles.title}>{isResetPin ? 'Reset PIN' : 'Verify OTP'}</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}</Text>

      {/* ✅ Combined OTP + Verify button row */}
      <View style={styles.otpRow}>
        <View style={styles.otpInputContainer}>
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

        <TouchableOpacity
          style={[styles.ctaSmall, loading && styles.disabled]}
          onPress={onVerify}
          disabled={loading}
        >
          <Text style={styles.ctaText}>{loading ? '...' : 'Verify'}</Text>
        </TouchableOpacity>
      </View>

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

  // ✅ New layout styles
  otpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInputContainer: {
    width: '70%',
  },
  ctaSmall: {
    width: '28%',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Existing styles unchanged
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    letterSpacing: 4,
    textAlign: 'left',
  },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  resend: { alignItems: 'center', marginTop: 16 },
  resendText: { color: '#2563eb' },
});
