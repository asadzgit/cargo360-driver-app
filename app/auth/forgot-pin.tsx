import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, ArrowLeft } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function ForgotPinScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!phone) {
      Alert.alert('Invalid Phone', 'Please enter your phone number.');
      return;
    }

    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      Alert.alert('Invalid Phone', validation.error || 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      // Try to send OTP directly - skip checkPhone validation as it may give false negatives
      // The backend will validate the phone number when sending OTP
      await apiService.resendOtp({ phone });
      
      // Navigate to OTP verification screen with resetPin flag
      router.replace({ pathname: '/auth/verify-otp', params: { phone, resetPin: 'true' } });
    } catch (e: any) {
      // Handle API errors from resendOtp
      const errorMessage = e?.message || 'Please try again';
      if (errorMessage.toLowerCase().includes('not registered') || 
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('does not exist') ||
          errorMessage.toLowerCase().includes('signup') ||
          errorMessage.toLowerCase().includes('invalid')) {
        Alert.alert('Phone not found', 'This phone number is not registered.');
      } else if (errorMessage.toLowerCase().includes('no active') || 
                 errorMessage.toLowerCase().includes('session') ||
                 errorMessage.toLowerCase().includes('otp not sent')) {
        // If resendOtp requires an active session, try using checkPhone to trigger OTP
        // This might send OTP for unverified phones
        try {
          const checkResult = await apiService.checkPhone({ phone, role: 'driver' });
          // If checkPhone sends OTP (for unverified phones), proceed
          if (checkResult.nextStep === 'verify_otp') {
            router.replace({ pathname: '/auth/verify-otp', params: { phone, resetPin: 'true' } });
            return;
          }
          // For verified users, we might need backend support for forgot PIN
          Alert.alert('Unable to send OTP', 'Please contact support or try using the resend button after reaching the OTP screen.');
        } catch (checkError: any) {
          Alert.alert('Failed to send OTP', checkError?.message || errorMessage);
        }
      } else {
        Alert.alert('Failed to send OTP', errorMessage);
      }
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
        <Text style={styles.title}>Forgot PIN</Text>
        <Text style={styles.subtitle}>Enter your phone number to reset your PIN</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Phone size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Continue'}</Text>
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

