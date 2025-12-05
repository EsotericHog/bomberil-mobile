import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { tokenStorage } from '@/utils/storage';
import client from '@/api/client';

// 1. Definimos la estructura del JWT (Payload)
// Modifica esto según lo que tu backend Django ponga dentro del token.
interface UserData {
  user_id: number;
  email: string;
  exp?: number; // Tiempo de expiración unix timestamp
}

// 2. Definimos la interfaz del Store (Los tipos de datos)
interface AuthState {
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
  userPermissions: string[]; // Lista de permisos (ej: ['accion_ver_inventario'])
  isLoading: boolean;
  
  // CORRECCIÓN: Ahora la interfaz acepta explícitamente los permisos
  signIn: (token: string, permissions: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  userPermissions: [],
  isLoading: true,

  // --- ACCIÓN: INICIAR SESIÓN ---
  signIn: async (token, permissions) => {
    // 1. Guardamos el token en disco (SecureStore)
    await tokenStorage.setToken(token);

    // 2. Decodificamos el usuario del token
    // El try-catch evita que la app explote si el token viene corrupto
    try {
      const user = jwtDecode<UserData>(token);
      set({ token, user, isAuthenticated: true, userPermissions: permissions });
    } catch (error) {
      console.error("Error al decodificar token en login:", error);
      // Si falla, no autenticamos
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // --- ACCIÓN: CERRAR SESIÓN ---
  signOut: async () => {
    await tokenStorage.removeToken();
    set({ token: null, user: null, isAuthenticated: false, userPermissions: [] });
  },

  // --- HELPER: VERIFICAR PERMISOS ---
  hasPermission: (perm: string) => {
    const { userPermissions } = get();
    // Retorna true si el permiso está en la lista
    return userPermissions.includes(perm);
  },

  // --- ACCIÓN: RESTAURAR SESIÓN (Al abrir la App) ---
  restoreSession: async () => {
    try {
      const token = await tokenStorage.getToken();
      
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // 1. Verificamos si el token es válido/no ha expirado localmente
      const user = jwtDecode<UserData>(token);
      const isExpired = user.exp ? (Date.now() / 1000) > user.exp : false;

      if (isExpired) {
        console.log('El token ha expirado');
        await get().signOut(); // Limpiamos todo
        set({ isLoading: false });
        return;
      }

      // 2. Restauramos estado inicial (Optimistic update)
      // Asumimos que está logueado mientras verificamos con el backend
      set({ token, user, isAuthenticated: true });

      // 3. (OPCIONAL PERO RECOMENDADO) Actualizar permisos frescos desde el backend
      // Aquí es donde usamos 'client'. Es vital envolverlo en try/catch.
      try {
        // CAMBIAR URL: Ajusta '/auth/me/' a tu endpoint real que devuelve perfil y permisos
        // const response = await client.get('/auth/me/'); 
        // const freshPermissions = response.data.permissions;
        
        // POR AHORA: Simulamos permisos estáticos para que te funcione sin backend listo
        const freshPermissions = ['accion_ver_inventario']; 
        
        set({ userPermissions: freshPermissions });
      } catch (apiError) {
        console.error("Error al refrescar permisos con backend:", apiError);
        // Si falla la red, mantenemos al usuario logueado pero quizás con permisos viejos o vacíos
        // Opcional: forzar logout si la política de seguridad es estricta.
      }

    } catch (e) {
      console.log('Error general restaurando sesión', e);
      await get().signOut();
    } finally {
      // Siempre quitamos el spinner de carga al final
      set({ isLoading: false });
    }
  },
}));