import { create } from 'zustand';
import { tokenStorage } from '@/utils/storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import * as LocalAuthentication from 'expo-local-authentication';
import { Linking, Alert } from 'react-native'; // <--- Usamos Linking nativo
import { API_URL } from '@/api/client'; // Asegúrate de importar tu URL base

// 1. Definimos la estructura del JWT (Payload)
interface UsuarioData {
  id: number;
  rut: string;
  email: string;
  nombre_completo: string;
  avatar: string | null;
}

interface EstacionData {
  id: number;
  nombre: string;
  codigo: string;
}

// Tipo para la respuesta completa de tu API
export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: UsuarioData;
  estacion: EstacionData | null;
  permisos: string[];
  membresia_id?: number;
}

// 2. Definimos la interfaz del Store (Los tipos de datos)
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UsuarioData | null;
  estacion: EstacionData | null;
  isAuthenticated: boolean;
  userPermissions: string[];
  isLoading: boolean;
  
  // Estado para UI de carga (opcional, para deshabilitar botón mientras abre navegador)
  isDownloading: boolean;

  // Estados biométricos
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;

  // Acciones
  signIn: (data: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setAccessToken: (newToken: string) => Promise<void>;
  hasPermission: (perm: string) => boolean;
  restoreSession: () => Promise<void>;

  checkBiometrics: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<boolean>;
  promptBiometrics: () => Promise<boolean>;
  unlockApp: () => Promise<void>;
  lockApp: () => void;

  // Acciones de Descarga (Simples)
  downloadHojaVida: () => void;
  downloadFichaMedica: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  estacion: null,
  isAuthenticated: false,
  userPermissions: [],
  isLoading: true,
  isDownloading: false,

  isBiometricSupported: false,
  isBiometricEnabled: false,
  isAppLocked: false,

  // --- ACCIÓN: INICIAR SESIÓN ---
  signIn: async (data: LoginResponse) => {
    await tokenStorage.setToken(data.access);
    if (data.refresh) await tokenStorage.setRefreshToken(data.refresh);

    // 2. Guardamos toda la data en memoria (Zustand)
    set({
      token: data.access,
      refreshToken: data.refresh,
      user: data.usuario,
      estacion: data.estacion,
      userPermissions: data.permisos,
      isAuthenticated: true,
      isLoading: false,
      isAppLocked: false
    });
  },

  // Acción ligera para refrescar solo el access token
  setAccessToken: async (newToken: string) => {
    await tokenStorage.setToken(newToken);
    set({ token: newToken });
  },

  // --- ACCIÓN: CERRAR SESIÓN ---
  signOut: async () => {
    try {
      // 1. Obtener el refresh token actual del estado
      const refreshToken = get().refreshToken;
      if (refreshToken) await client.post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken });
    } catch (e) {
      console.log("Error logout:", e);
    } finally {
      await tokenStorage.removeToken();
      await tokenStorage.removeRefreshToken();
      set({ 
        token: null, refreshToken: null, user: null, estacion: null, 
        isAuthenticated: false, userPermissions: [], isAppLocked: false 
      });
    }
  },

  hasPermission: (perm: string) => get().userPermissions.includes(perm),

  // --- RESTORE SESSION ---
  restoreSession: async () => {
    try {
      const token = await tokenStorage.getToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      const isBioEnabled = await tokenStorage.getBiometricPreference();
      
      if (!token || !refreshToken) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      const response = await client.get(ENDPOINTS.AUTH.ME);
      const data = response.data;
      const shouldLock = isBioEnabled;

      set({ 
        token, 
        refreshToken, 
        user: data.usuario,
        estacion: data.estacion,
        userPermissions: data.permisos,
        isAuthenticated: true,
        isLoading: false, 
        isBiometricEnabled: isBioEnabled,
        isAppLocked: shouldLock
      });
      
    } catch (error) {
      console.log('Error session:', error);
      await get().signOut();
      set({ isLoading: false });
    }
  },

  // --- BIOMETRÍA ---
  checkBiometrics: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const isEnabled = await tokenStorage.getBiometricPreference();
    set({ isBiometricSupported: compatible && enrolled, isBiometricEnabled: compatible && enrolled && isEnabled });
  },

  toggleBiometrics: async (enable: boolean) => {
    if (enable) {
      const success = await get().promptBiometrics();
      if (!success) return false;
    }
    await tokenStorage.setBiometricPreference(enable);
    set({ isBiometricEnabled: enable });
    return true;
  },

  promptBiometrics: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch { return false; }
  },

  unlockApp: async () => {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Bomberil System',
        disableDeviceFallback: false,
    });
    if (result.success) set({ isAppLocked: false });
  },

  lockApp: () => set({ isAppLocked: true }),

  // --- DESCARGAS SIMPLES (Navegador) ---
  // SOLUCIÓN AL ERROR: Eliminamos expo-file-system y usamos Linking
  
  downloadHojaVida: () => {
    const token = get().token;
    if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
    }
    // Concatenamos URL base + Endpoint + Token
    const url = `${API_URL}${ENDPOINTS.PERFIL.DESCARGAR_HOJA_VIDA}?token=${token}`;
    
    Linking.openURL(url).catch(err => {
        console.error("Error abriendo navegador:", err);
        Alert.alert("Error", "No se pudo abrir el navegador para descargar.");
    });
  },

  downloadFichaMedica: () => {
    const token = get().token;
    if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
    }
    const url = `${API_URL}${ENDPOINTS.PERFIL.DESCARGAR_FICHA_MEDICA}?token=${token}`;
    
    Linking.openURL(url).catch(err => {
        console.error("Error abriendo navegador:", err);
        Alert.alert("Error", "No se pudo abrir el navegador para descargar.");
    });
  },
}));