import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const STATUS_MESSAGE = 'Loading your account…';

export default function IndexScreen() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth');
    }
  }, [user, authReady]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/cargo-icon.png')}
          style={styles.logo}
        />
        <Text style={styles.appName}>Cargo360 Connect</Text>
        <Text style={styles.statusText}>{STATUS_MESSAGE}</Text>
      </View>
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 16,
    borderRadius: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});