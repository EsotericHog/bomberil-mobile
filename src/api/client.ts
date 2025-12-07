import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // Usando el alias
import { ENDPOINTS } from './endpoints';

// NOTA IMPORTANTE SOBRE LA URL:
// 1. Emulador Android: Usa 'http://10.0.2.2:8000/api/' (apunta al localhost de tu PC).
// 2. Dispositivo Físico (USB/WiFi): Usa tu IP local, ej: 'http://192.168.1.15:8000/api/'.
// 3. Emulador iOS: Usa 'http://localhost:8000/api/'.
const API_URL = 'http://10.0.2.2:8000/api/v1/'; 

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// 1. Interceptor de Request: Inyecta el Access Token actual. Se ejecuta ANTES de que salga cada petición.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (No autorizado) y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos para no entrar en bucle infinito

      try {
        // Obtenemos el refresh token del store
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
            throw new Error('No hay refresh token disponible');
        }

        // Llamamos al endpoint de refresh (usamos axios puro para evitar interceptores circulares)
        const response = await axios.post(`${API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
          refresh: refreshToken
        });
        
        // Obtener datos de la respuesta del servidor
        const newData = response.data;

        // Guardamos el nuevo token en el store
        await useAuthStore.getState().setAccessToken(newData.access);

        // BONUS: Actualizamos también los permisos/estación en el store silenciosamente
        // Esto mantiene la app al día incluso sin reiniciar
        useAuthStore.setState({
            user: newData.usuario,
            estacion: newData.estacion,
            userPermissions: newData.permisos
        });

        // Actualizamos el header de la petición original y reintentamos
        originalRequest.headers.Authorization = `Bearer ${newData.access}`;
        return client(originalRequest);

      } catch (refreshError) {
        // Si el refresh falla (token vencido o inválido), cerramos sesión
        console.log('Sesión expirada, cerrando sesión...');
        useAuthStore.getState().signOut();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default client;