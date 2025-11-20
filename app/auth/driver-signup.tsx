import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { validatePakistaniPhone } from '@/utils/phoneValidation';

export default function DriverSignupScreen() {
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
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    
    // Validate Pakistani phone number
    const phoneValidation = validatePakistaniPhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      Alert.alert('Invalid Phone Number', phoneValidation.error || 'Please enter a valid Pakistani phone number');
      return false;
    }
    
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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
        'Registration Successful',
        'Your driver account has been created and is pending approval. You will be notified once approved.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#64748b" />
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Driver Registration</Text>
        <Text style={styles.subtitle}>Create your driver account</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="e.g. 03001234567, 923001234567, or +923001234567"
            keyboardType="phone-pad"
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="Enter your password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.signupButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Sign in here</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Note: Your account will be reviewed and approved by an administrator before you can start accepting shipments.
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
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
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
