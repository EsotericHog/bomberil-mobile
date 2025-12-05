import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
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
};