import axios from 'axios';
import { tokenStorage } from '@/utils/storage';
import { ENDPOINTS } from './endpoints';

// NOTA IMPORTANTE SOBRE LA URL:
// 1. Emulador Android: Usa 'http://10.0.2.2:8000/api/' (apunta al localhost de tu PC).
// 2. Dispositivo Físico (USB/WiFi): Usa tu IP local, ej: 'http://192.168.1.15:8000/api/'.
// 3. Emulador iOS: Usa 'http://localhost:8000/api/'.
export const API_URL = 'http://10.0.2.2:8000/api/v1/'; 

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INYECCIÓN DEL STORE ---
let store: any = null;
export const injectStore = (_store: any) => {
  store = _store;
};

// --- COLA DE PETICIONES ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- INTERCEPTOR REQUEST ---
client.interceptors.request.use(async (config) => {
  let token = store?.getState().token;
  
  if (!token) {
    token = await tokenStorage.getToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// --- INTERCEPTOR RESPONSE ---
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    // Evitar bucles infinitos en logout
    if (originalRequest.url?.includes('auth/logout')) {
        return Promise.reject(error);
    }

    const status = error.response.status;

    // Detectamos 401 (Token inválido) o 403 (Permiso denegado por token expirado en algunos backends)
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      
      if (isRefreshing) {
        // Si ya estamos refrescando, encolamos esta petición
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return client(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. Obtener Refresh Token (Memoria > Disco)
        let refreshToken = store?.getState().refreshToken;
        if (!refreshToken) {
            console.log('[Auth] Refresh token no en memoria, buscando en storage...');
            refreshToken = await tokenStorage.getRefreshToken();
        }

        if (!refreshToken) {
            console.log('[Auth] No refresh token available. Force Logout.');
            throw new Error('No refresh token');
        }

        console.log('[Auth] Refreshing token ending in:', refreshToken.slice(-5));

        // 2. Petición de Refresh (Axios puro para evitar interceptores)
        const response = await axios.post(
            `${API_URL}${ENDPOINTS.AUTH.REFRESH}`, 
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const { access, refresh } = response.data;
        
        console.log('[Auth] Refresh success. New Access received.');
        if (refresh) console.log('[Auth] New Refresh token received (Rotation ON).');
        else console.log('[Auth] No new Refresh token received (Rotation OFF).');

        // 3. Actualizar Store y Storage
        if (store) {
            await store.getState().setTokens({ access, refresh });
        } else {
            // Fallback por si el store no se inyectó (no debería pasar)
            await tokenStorage.setToken(access);
            if (refresh) await tokenStorage.setRefreshToken(refresh);
        }

        // 4. Procesar la cola
        processQueue(null, access);
        
        // 5. Reintentar la petición original con el nuevo token
        // Fix para Axios modernos: usar set si existe, o asignación directa
        if (originalRequest.headers.set) {
            originalRequest.headers.set('Authorization', `Bearer ${access}`);
        } else {
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
        }
        
        return client(originalRequest);

      } catch (refreshError: any) {
        processQueue(refreshError, null);
        console.log('[Auth] Refresh FAILED:', refreshError.response?.data || refreshError.message);
        
        // Si falla el refresco, sesión muerta: Limpiar todo
        await tokenStorage.removeToken();
        await tokenStorage.removeRefreshToken();
        store?.getState().signOut();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;