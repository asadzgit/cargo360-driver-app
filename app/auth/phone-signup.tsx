import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/api';
import { validatePakistaniPhone } from '@/utils/phoneValidation';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function PhoneSignupScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage(); // Force re-render when language changes
  const { phone: phoneParam, role: roleParam } = useLocalSearchParams<{ phone?: string; role?: 'trucker' | 'driver' }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(phoneParam || '');
  const [phoneError, setPhoneError] = useState('');
  const role = (roleParam as 'trucker' | 'driver') || 'driver';
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const onSubmit = async () => {
    if (!name.trim() || !phone) {
      Alert.alert(t('auth.missingFields'), t('auth.enterNameAndPhone'));
      return;
    }

    // Validate phone number
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || t('auth.invalidPhoneNumber'));
      Alert.alert(t('auth.invalidPhoneNumber'), validation.error || t('auth.enterValidPakistaniPhone'));
      return;
    }
    setLoading(true);
    try {
      await apiService.phoneSignup({ name: name.trim(), phone, role });
      router.replace({ pathname: '/auth/verify-otp', params: { phone } });
    } catch (e: any) {
      Alert.alert(t('auth.signupFailed'), e?.message || t('auth.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LanguageToggle />
      </View>
      <Text style={styles.title}>{t('auth.signUp')}</Text>
      <Text style={styles.subtitle}>{t('auth.createAccountFor', { role: role === 'driver' ? t('auth.driver') : t('auth.broker') })}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.fullName')}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('auth.yourName')} placeholderTextColor="#9ca3af" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.phone')}</Text>
        <TextInput 
          style={[styles.input, phoneError && styles.inputError]} 
          value={phone} 
          onChangeText={handlePhoneChange} 
          placeholder={t('auth.phonePlaceholderExtended')} 
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad" 
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      </View>

      <TouchableOpacity style={[styles.cta, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? t('auth.pleaseWait') : t('auth.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: 100 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#ffffff' },
  cta: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
});
