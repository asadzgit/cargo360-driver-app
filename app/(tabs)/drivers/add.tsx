import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import { useDrivers } from '@/hooks/useDrivers';
import { ArrowLeft } from 'lucide-react-native';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function AddDriverScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addDriver } = useDrivers();
  const router = useRouter();

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleAddDriver = async () => {
    if (!name || !phone) {
      Alert.alert(t('dashboard.error'), t('dashboard.pleaseProvideDriverNameAndPhone'));
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
      const res = await addDriver({ name, phone });
      const message = (res as any)?.message || t('dashboard.driverAddedAndOTPSent');
      Alert.alert(t('dashboard.success'), message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const msg = error?.message || t('dashboard.failedToAddDriver');
      Alert.alert(t('dashboard.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('dashboard.addNewDriver')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.fullName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('dashboard.enterDriversFullName')}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder={t('auth.phonePlaceholderExtended')}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleAddDriver}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? t('dashboard.addingDriver') : t('dashboard.addDriver')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor:'#024d9a',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    color:'#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
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
  addButton: {
    backgroundColor: '#024d9a',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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