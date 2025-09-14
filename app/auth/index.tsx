import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Users } from 'lucide-react-native';

export default function AuthIndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/cargo-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Cargo360 Connect</Text>
        {/* <Text style={styles.subtitle}>Choose your role to continue</Text> */}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.brokerButton]}
          onPress={() => router.push('/auth/login')}
        >
          <Users size={24} color="#ffffff" />
          <Text style={styles.buttonText}>Broker Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.driverButton]}
          onPress={() => router.push('/auth/driver-login')}
        >
          <Truck size={24} color="#ffffff" />
          <Text style={styles.buttonText}>Driver Login</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => router.push('/auth/register')}
      >
        <Text style={styles.registerText}>New broker? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  logo: {
    width: 128,
    height: 128,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  brokerButton: {
    backgroundColor: '#2563eb',
  },
  driverButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  registerText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
});