import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Eye, EyeOff } from 'lucide-react-native';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function EnterPinScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const [phone] = useState(phoneParam || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();
  const { phoneLogin } = useAuth();

  const onSubmit = async () => {
    if (pin.length !== 6) {
      Alert.alert(t('auth.invalidPin'), t('auth.pinMustBe6Digits'));
      return;
    }
    setLoading(true);
    try {
      await phoneLogin(phone, pin);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t('auth.loginFailed'), e?.message || t('auth.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('auth.enterPin')}</Text>
        <View style={styles.smallToggle}>
          <LanguageToggle />
        </View>
      </View>
      <Text style={styles.subtitle}>{t('auth.enterYourPin', { phone })}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.pin')}</Text>
        <View style={styles.rowContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder={t('auth.enterYourPinPlaceholder')}
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
          <TouchableOpacity 
            style={[styles.cta, loading && styles.disabled]} 
            onPress={onSubmit} 
            disabled={loading}
          >
            <Text style={styles.ctaText}>{loading ? '...' : t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/auth/forgot-pin')} 
        style={{ alignSelf: 'flex-end', marginTop: 12 }}
      >
        <Text style={{ color: '#059669', fontWeight: '600' }}>{t('auth.forgotPin')}</Text>
      </TouchableOpacity>

      <WhatsAppButton accessibilityLabel="Contact Cargo360 support on WhatsApp" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: 100 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallToggle: {
    transform: [{ scale: 0.9 }],
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  input: { 
    flex: 1,
    fontSize: 15,
    backgroundColor: 'transparent',
    letterSpacing: 0.5,
    textAlign: 'left',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 14,
    minHeight: 48,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cta: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
