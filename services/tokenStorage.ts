import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'cargo360.accessToken';
const REFRESH_TOKEN_KEY = 'cargo360.refreshToken';

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
    return secureStoreAvailable;
  } catch (error) {
    console.warn('SecureStore availability check failed:', error);
    secureStoreAvailable = false;
    return false;
  }
}

async function setItem(key: string, value: string) {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.setItemAsync(key, value, {
      keychainService: 'cargo360.tokens',
    });
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string) {
  const available = await isSecureStoreAvailable();
  if (available) {
    return SecureStore.getItemAsync(key, {
      keychainService: 'cargo360.tokens',
    });
  }
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string) {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.deleteItemAsync(key, {
      keychainService: 'cargo360.tokens',
    });
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export const tokenStorage = {
  async saveTokens(tokens: { accessToken: string; refreshToken: string }) {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
    ]);
  },
};

