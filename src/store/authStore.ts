import { create } from 'zustand';
import { tokenStorage } from '@/utils/storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import * as LocalAuthentication from 'expo-local-authentication';

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
  estacion: EstacionData | null; // Guardamos la estación activa
  isAuthenticated: boolean;
  userPermissions: string[];
  isLoading: boolean;

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

  //Acciones biométricas
  checkBiometrics: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<boolean>;
  promptBiometrics: () => Promise<boolean>;
  unlockApp: () => Promise<void>;
  lockApp: () => void;
}



export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  estacion: null,
  isAuthenticated: false,
  userPermissions: [],
  isLoading: true,
  isBiometricSupported: false,
  isBiometricEnabled: false,
  isAppLocked: false,

  // --- ACCIÓN: INICIAR SESIÓN ---
  signIn: async (data: LoginResponse) => {
    // 1. Guardamos el token en disco (SecureStore)
    await tokenStorage.setToken(data.access);
    if (data.refresh) {
      await tokenStorage.setRefreshToken(data.refresh);
    }

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

      if (refreshToken) {
        // 2. Avisar al backend para blacklisting (Fire and forget)
        // Usamos client.post. Si falla (ej. sin internet), no importa,
        // procedemos a borrar localmente igual para que el usuario pueda salir.
        await client.post(ENDPOINTS.AUTH.LOGOUT, {
            refresh: refreshToken
        });
      }
    } catch (error) {
      console.log("Error notificando logout al servidor (posiblemente offline)", error);
    } finally {
      // 3. SIEMPRE borrar datos locales y limpiar estado
      await tokenStorage.removeToken();
      await tokenStorage.removeRefreshToken();
      // Si implementaste setRefreshToken en storage, bórralo aquí también

      set({ 
        token: null, 
        refreshToken: null, 
        user: null, 
        estacion: null, 
        isAuthenticated: false, 
        userPermissions: [],
        isAppLocked: false
      });
    }
  },

  // --- HELPER: VERIFICAR PERMISOS ---
  hasPermission: (perm: string) => {
    return get().userPermissions.includes(perm);
  },

  // --- ACCIÓN: RESTAURAR SESIÓN (Al abrir la App) ---
  restoreSession: async () => {
    try {
      // 1. Solo verificamos si existen los tokens en disco
      const token = await tokenStorage.getToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      const isBioEnabled = await tokenStorage.getBiometricPreference();
      
      if (!token || !refreshToken) { // Si falta alguno, no podemos restaurar
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // 2. Llamamos DIRECTAMENTE a Auth Me.
      // El interceptor de request nuevo (client.ts) se encargará de leer el token del disco
      // si el estado está vacío.
      const response = await client.get(ENDPOINTS.AUTH.ME);
      const data = response.data; // { usuario, estacion, permisos, membresia_id }

      // 3. DECISIÓN DE BLOQUEO
      // Si la biometría está activada, la app inicia BLOQUEADA
      const shouldLock = isBioEnabled;

      // 3. Si todo salió bien, actualizamos el estado
      set({ 
        token, // Token del disco (o el renovado si el interceptor actuó)
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
      console.log('Error restaurando sesión (Token inválido o sin internet):', error);
      
      // Si falla auth/me (ej. 401 definitivo, usuario borrado, membresía revocada), 
      // limpiamos todo y mandamos al Login.
      await get().signOut();
      set({ isLoading: false });
    }
  },


  // --- LÓGICA BIOMÉTRICA ---
  // 1. Verificar si el celular tiene hardware y si el usuario lo activó antes
  checkBiometrics: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const isSupported = compatible && enrolled;
    // Recuperar preferencia guardada
    const isEnabled = await tokenStorage.getBiometricPreference();

    set({ isBiometricSupported: isSupported, isBiometricEnabled: isSupported && isEnabled });
  },

  // 2. Activar/Desactivar la opción (Para el perfil)
  toggleBiometrics: async (enable: boolean) => {
    if (enable) {
      // Confirmar identidad antes de activar
      const success = await get().promptBiometrics();
      if (!success) return false;
    }
    
    // Solo guardamos la preferencia, nada de tokens
    await tokenStorage.setBiometricPreference(enable);
    set({ isBiometricEnabled: enable });
    return true;
  },

  // 3. Solicitar la huella (El Popup nativo)
  promptBiometrics: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permite usar PIN si falla la huella
      });
      return result.success;
    } catch (error) {
      console.log('Error biométrico:', error);
      return false;
    }
  },

  // --- APP LOCKER ---
  unlockApp: async () => {
    // Pedir huella
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Bomberil System',
        disableDeviceFallback: false,
    });

    if (result.success) {
        set({ isAppLocked: false }); // <--- ¡ABRE LA APP!
    }
  },

  lockApp: () => {
    set({ isAppLocked: true });
  },
}));

//      // Decodificación simple para restauración optimista
//      // (Aquí podrías agregar lógica para verificar si el token expiró y llamar al refresh automáticamente)
//      const decoded = jwtDecode<TokenPayload>(token);
//      const isExpired = decoded.exp ? (Date.now() / 1000) > decoded.exp : true;
//
//      if (isExpired) {
//        await get().signOut();
//        set({ isLoading: false });
//        return;
//      }
//
//      // RESTAURACIÓN OPTIMISTA:
//      // Como el token tiene tus claims personalizados (rut, nombre), 
//      // podemos restaurar una sesión básica sin llamar a la API inmediatamente.
//      // NOTA: Para recuperar 'permisos' y 'avatar' real, deberías llamar a un endpoint 
//      // tipo '/auth/me/' aquí, pero por ahora usaremos los datos del token.
//      
//      const userRestored = {
//        id: decoded.user_id,
//        rut: decoded.rut || '',
//        nombre_completo: decoded.nombre || '',
//        email: '',
//        avatar: null
//      };
//
//      set({ 
//        token, 
//        user: userRestored, 
//        isAuthenticated: true, 
//        isLoading: false 
//      });
//
//    } catch (e) {
//      console.error('Error restaurando sesión:', e);
//      set({ token: null, isAuthenticated: false, isLoading: false });
//    }
//  },
//}));