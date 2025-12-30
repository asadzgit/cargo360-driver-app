import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function DriverLoginScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage(); // Force re-render when language changes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginDriver } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.pleaseTryAgain'));
      return;
    }

    setLoading(true);
    try {
      await loginDriver(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('auth.driverLogin'), error instanceof Error ? error.message : t('auth.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/auth/driver-signup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <LanguageToggle />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{t('auth.driverLogin')}</Text>
        <Text style={styles.subtitle}>{t('auth.enterDriverCredentials')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.enterEmail')}
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.enterPassword')}
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            {t('auth.dontHaveDriverAccount')}
          </Text>
          <TouchableOpacity onPress={handleSignup} style={styles.signupButton}>
            <Text style={styles.signupButtonText}>{t('auth.signUpHere')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    flex: 1,
    justifyContent: 'center',
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
    color: '#1e293b',
  },
  loginButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
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
    lineHeight: 20,
  },
  signupButton: {
    marginTop: 8,
  },
  signupButtonText: {
    fontSize: 14,
    color: '#059669',
    textDecorationLine: 'underline',
  },
});