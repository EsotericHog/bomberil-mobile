import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const BIOMETRIC_KEY = 'biometric_enabled';

export const tokenStorage = {
  // --- ACCESS TOKEN ---
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },
  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  removeToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  // --- REFRESH TOKEN ---
  getRefreshToken: async () => {
    try { return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY); } catch (e) { return null; }
  },
  setRefreshToken: async (token: string) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken: async () => {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  // --- BIOMETRÍA ---
  getBiometricPreference: async () => {
    try {
      const result = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      return result === 'true'; // Convertimos texto a booleano
    } catch (error) {
      return false;
    }
  },
  setBiometricPreference: async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
  },
};