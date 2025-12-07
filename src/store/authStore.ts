import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { tokenStorage } from '@/utils/storage';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

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
}

// Estructura del Payload del Token (lo que viene encriptado en 'access')
interface TokenPayload {
  user_id: number;
  rut: string;
  nombre: string;
  exp: number;
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

  // Acciones
  signIn: (data: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setAccessToken: (newToken: string) => Promise<void>;
  hasPermission: (perm: string) => boolean;
  restoreSession: () => Promise<void>;
}



export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  estacion: null,
  isAuthenticated: false,
  userPermissions: [],
  isLoading: true,

  // --- ACCIÓN: INICIAR SESIÓN ---
  signIn: async (data: LoginResponse) => {
    // 1. Guardamos el token en disco (SecureStore)
    await tokenStorage.setToken(data.access);

    // 2. Guardamos toda la data en memoria (Zustand)
    set({
      token: data.access,
      refreshToken: data.refresh,
      user: data.usuario,
      estacion: data.estacion,
      userPermissions: data.permisos,
      isAuthenticated: true,
      isLoading: false
    });
  },

  // Acción ligera para refrescar solo el access token
  setAccessToken: async (newToken: string) => {
    await tokenStorage.setToken(newToken);
    set({ token: newToken });
  },

  // --- ACCIÓN: CERRAR SESIÓN ---
  signOut: async () => {
    await tokenStorage.removeToken();
    set({ 
      token: null, 
      refreshToken: null, 
      user: null, 
      estacion: null, 
      isAuthenticated: false, 
      userPermissions: [] 
    });
  },

  // --- HELPER: VERIFICAR PERMISOS ---
  hasPermission: (perm: string) => {
    return get().userPermissions.includes(perm);
  },

  // --- ACCIÓN: RESTAURAR SESIÓN (Al abrir la App) ---
  restoreSession: async () => {
    try {
      const token = await tokenStorage.getToken();
      
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      // 2. Lo ponemos en el estado temporalmente para que el interceptor de axios lo use
      set({ token });

      // 3. Llamamos a AUTH/ME para validar si el token sigue vivo 
      // y obtener DATOS FRESCOS del backend.
      const response = await client.get(ENDPOINTS.AUTH.ME);

      // NOTA: Gracias al interceptor de refresh, si el token estaba vencido,
      // client.ts ya lo refrescó internamente antes de llegar aquí.

      const data = response.data; // { usuario, estacion, permisos, membresia_id }

      // 4. Actualizamos el store con la verdad absoluta del servidor
      set({ 
        user: data.usuario,
        estacion: data.estacion,
        userPermissions: data.permisos,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      console.log('Error restaurando sesión (Token inválido o sin internet):', error);
      
      // Si falla auth/me (ej. 401 definitivo, usuario borrado, membresía revocada), 
      // limpiamos todo y mandamos al Login.
      await get().signOut();
      set({ isLoading: false });
    }
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