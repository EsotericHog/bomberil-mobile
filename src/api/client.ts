import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
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


// 1. Interceptor de Request
client.interceptors.request.use(async (config) => {
  // Intentamos leer del store
  let token = useAuthStore.getState().token;
  
  // FAILSAFE: Si el store está vacío (arranque), leemos del disco
  if (!token) {
    token = await tokenStorage.getToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// 2. Interceptor de Response
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (No autorizado) y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos para no entrar en bucle infinito

      try {
        // Obtenemos el refresh token del store
        let refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
            refreshToken = await tokenStorage.getRefreshToken();
        }
        
        if (!refreshToken) {
            throw new Error('No hay refresh token disponible ni en memoria ni en disco');
        }

        // Llamamos al endpoint de refresh (usamos axios puro para evitar interceptores circulares)
        const response = await axios.post(`${API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
          refresh: refreshToken
        });
        
        // Obtener datos de la respuesta del servidor
        const newData = response.data;

        // Guardamos todo en el store para sincronizar
        useAuthStore.getState().signIn(newData); // Usamos signIn que ya actualiza todo

        // Actualizamos el header de la petición original y reintentamos
        originalRequest.headers.Authorization = `Bearer ${newData.access}`;
        return client(originalRequest);

      } catch (refreshError) {
        // Si el refresh falla (token vencido o inválido), cerramos sesión
        console.log('Sesión expirada definitivamente, limpiando...');
        // Evitamos bucles llamando directamente a limpiar storage si el store falla
        await tokenStorage.removeToken();
        await tokenStorage.removeRefreshToken();
        useAuthStore.getState().signOut();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default client;