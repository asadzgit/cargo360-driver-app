import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDrivers } from '@/hooks/useDrivers';
import { ArrowLeft } from 'lucide-react-native';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function AddDriverScreen() {
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
      Alert.alert('Error', 'Please provide driver name and phone number');
      return;
    }

    // Validate phone number
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      Alert.alert('Invalid Phone Number', validation.error || 'Please enter a valid Pakistani phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await addDriver({ name, phone });
      const message = (res as any)?.message || 'Driver added and OTP sent.';
      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const msg = error?.message || 'Failed to add driver. Please try again.';
      Alert.alert('Error', error);
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
        <Text style={styles.title}>Add New Driver</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter driver's full name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="e.g. 03001234567, 923001234567, or +923001234567"
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
            {loading ? 'Adding Driver...' : 'Add Driver'}
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