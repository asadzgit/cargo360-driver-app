import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { validatePakistaniPhone } from '@/utils/phoneValidation';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function DriverSignupScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage(); // Force re-render when language changes
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear phone error when user starts typing
    if (field === 'phone' && phoneError) {
      setPhoneError('');
    }
  };

  const validateForm = () => {
    const { name, email, phone, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      Alert.alert(t('auth.error'), t('auth.enterFullName'));
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert(t('auth.error'), t('auth.enterEmail'));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('auth.error'), t('auth.enterEmail'));
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert(t('auth.error'), t('auth.enterPhoneNumber'));
      return false;
    }
    
    // Validate Pakistani phone number
    const phoneValidation = validatePakistaniPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || t('auth.invalidPhoneNumber'));
      Alert.alert(t('auth.invalidPhoneNumber'), phoneValidation.error || t('auth.enterValidPakistaniPhone'));
      return false;
    }
    
    if (!password) {
      Alert.alert(t('auth.error'), t('auth.enterPassword'));
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert(t('auth.error'), t('auth.enterPassword'));
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.confirmYourPassword'));
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'driver',
      });
      
      Alert.alert(
        t('auth.createAccount'),
        t('auth.accountReviewNote'),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('auth.signupFailed'),
        error instanceof Error ? error.message : t('auth.pleaseTryAgain')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <LanguageToggle />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{t('auth.driverRegistration')}</Text>
        <Text style={styles.subtitle}>{t('auth.createDriverAccount')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.fullName')}</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder={t('auth.enterFullName')}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder={t('auth.enterEmail')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder={t('auth.phonePlaceholderExtended')}
            keyboardType="phone-pad"
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder={t('auth.enterPassword')}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder={t('auth.confirmYourPassword')}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.signupButtonText}>
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            {t('auth.alreadyHaveAccount')}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>{t('auth.signInHere')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            {t('auth.accountReviewNote')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  form: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  signupButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 14,
    color: '#059669',
    textDecorationLine: 'underline',
  },
  noteContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
});
