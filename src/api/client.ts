import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // Usando el alias

// NOTA IMPORTANTE SOBRE LA URL:
// 1. Emulador Android: Usa 'http://10.0.2.2:8000/api/' (apunta al localhost de tu PC).
// 2. Dispositivo Físico (USB/WiFi): Usa tu IP local, ej: 'http://192.168.1.15:8000/api/'.
// 3. Emulador iOS: Usa 'http://localhost:8000/api/'.
const API_URL = 'http://10.0.2.2:8000/api/'; 

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE REQUEST ---
// Se ejecuta ANTES de que salga cada petición.
client.interceptors.request.use((config) => {
  // Usamos .getState() para leer el store sin estar dentro de un componente React.
  // Esto evita bucles y permite acceder al token desde cualquier archivo JS/TS.
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- INTERCEPTOR DE RESPONSE ---
// Se ejecuta CUANDO recibimos una respuesta (o error).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend devuelve 401 (Unauthorized), significa que el token venció o es inválido.
    if (error.response?.status === 401) {
      console.warn('Sesión expirada o inválida (401). Cerrando sesión...');
      useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  }
);

export default client;