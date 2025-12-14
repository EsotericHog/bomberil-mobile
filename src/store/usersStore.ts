import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { UsuarioResumen, UsuarioDetalle, HojaVidaFull, FichaMedicaFull } from '@/features/usuarios/types';
import { Alert } from 'react-native';

interface UsersState {
  usuarios: UsuarioResumen[];
  
  // Cache temporal para el usuario seleccionado
  selectedUsuario: UsuarioDetalle | null;
  selectedHojaVida: HojaVidaFull | null;
  selectedFichaMedica: FichaMedicaFull | null;
  
  isLoading: boolean;
  error: string | null;

  fetchUsuarios: (query?: string) => Promise<void>;
  
  fetchUsuarioDetalle: (id: string) => Promise<void>;
  fetchHojaVida: (id: string) => Promise<void>;
  fetchFichaMedica: (id: string, suppressError?: boolean) => Promise<boolean>;
  
  clearSelection: () => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  usuarios: [],
  selectedUsuario: null,
  selectedHojaVida: null,
  selectedFichaMedica: null,
  isLoading: false,
  error: null,

  fetchUsuarios: async (query = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.USUARIOS.LISTA(query));
      set({ usuarios: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar usuarios", isLoading: false });
    }
  },

  fetchUsuarioDetalle: async (id) => {
    set({ isLoading: true, error: null, selectedUsuario: null });
    try {
      const response = await client.get(ENDPOINTS.USUARIOS.DETALLE(id));
      set({ selectedUsuario: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar detalle", isLoading: false });
    }
  },

  fetchHojaVida: async (id) => {
    set({ isLoading: true, error: null, selectedHojaVida: null });
    try {
      const response = await client.get(ENDPOINTS.USUARIOS.HOJA_VIDA(id));
      set({ selectedHojaVida: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar Hoja de Vida", isLoading: false });
    }
  },

  fetchFichaMedica: async (id: string, suppressError = false) => {
    set({ isLoading: true, error: null, selectedFichaMedica: null });
    try {
      const response = await client.get(ENDPOINTS.USUARIOS.FICHA_MEDICA(id));
      set({ selectedFichaMedica: response.data, isLoading: false });
      return true;
    } catch (error: any) {
      // Manejo específico para 403 (Sin permiso) o 404
      const msg = error.response?.status === 403 
        ? "No tienes permisos para ver esta ficha médica." 
        : "No se pudo cargar la ficha médica.";
      
      if (!suppressError) {
        Alert.alert("Acceso Denegado", msg);
      }
      set({ isLoading: false });
      return false;
    }
  },

  clearSelection: () => set({ selectedUsuario: null, selectedHojaVida: null, selectedFichaMedica: null }),
}));