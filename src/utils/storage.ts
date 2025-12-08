import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const BIOMETRIC_KEY = 'biometric_enabled';

export const tokenStorage = {
  // --- TOKENS ---
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