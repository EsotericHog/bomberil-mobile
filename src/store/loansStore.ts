import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { PrestamoResumen, Destinatario, ItemPrestable, CrearPrestamoPayload, PrestamoFull, GestionarDevolucionPayload } from '@/features/inventario/types';
import { Alert } from 'react-native';

interface LoansState {
  prestamos: PrestamoResumen[];
  destinatarios: Destinatario[];
  itemsPrestables: ItemPrestable[]; // Resultados de búsqueda para agregar al carrito
  currentPrestamo: PrestamoFull | null;
  isLoading: boolean;
  error: string | null;

  // Acciones de Lectura
  fetchPrestamos: (todos?: boolean, search?: string) => Promise<void>;
  fetchDestinatarios: () => Promise<void>;
  fetchItemsPrestables: (query: string) => Promise<void>;
  fetchDetallePrestamo: (id: number) => Promise<void>;
  
  // Acciones de Escritura
  crearPrestamo: (payload: CrearPrestamoPayload) => Promise<boolean>;
  gestionarDevolucion: (id: number, payload: GestionarDevolucionPayload) => Promise<boolean>;
  
  // Limpieza
  clearItemsPrestables: () => void;
  clearCurrentPrestamo: () => void;
}

export const useLoansStore = create<LoansState>((set, get) => ({
  prestamos: [],
  destinatarios: [],
  itemsPrestables: [],
  currentPrestamo: null,
  isLoading: false,
  error: null,

  fetchPrestamos: async (todos = false, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_HISTORIAL(todos, search));
      set({ prestamos: response.data, isLoading: false });
    } catch (error: any) {
      console.log("Error fetching loans:", error);
      set({ error: "No se pudo cargar el historial", isLoading: false });
    }
  },

  fetchDestinatarios: async () => {
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_DESTINATARIOS);
      set({ destinatarios: response.data });
    } catch (error) {
      console.log("Error fetching destinatarios:", error);
    }
  },

  fetchItemsPrestables: async (query: string) => {
    if (!query) return;
    set({ isLoading: true }); // Loading local para el buscador
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_BUSCAR_ITEMS(query));
      // Asumimos que devuelve una lista directa
      set({ itemsPrestables: response.data, isLoading: false });
    } catch (error) {
      console.log("Error buscando items prestables:", error);
      set({ itemsPrestables: [], isLoading: false });
    }
  },

  fetchDetallePrestamo: async (id: number) => {
    set({ isLoading: true, error: null, currentPrestamo: null });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_DEVOLUCION(id));
      set({ currentPrestamo: response.data, isLoading: false });
    } catch (error: any) {
      console.log("Error fetching loan detail:", error);
      set({ error: "No se pudo cargar el detalle.", isLoading: false });
    }
  },

  crearPrestamo: async (payload: CrearPrestamoPayload) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(ENDPOINTS.INVENTARIO.PRESTAMOS_CREAR, payload);
      
      // Recargar historial si estamos en esa pantalla
      await get().fetchPrestamos(); 
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error creando préstamo:", error);
      const msg = error.response?.data?.detail || "Error al crear el préstamo.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  gestionarDevolucion: async (id: number, payload: GestionarDevolucionPayload) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(ENDPOINTS.INVENTARIO.PRESTAMOS_DEVOLUCION(id), payload);
      
      // Recargar el detalle para ver los nuevos saldos
      await get().fetchDetallePrestamo(id);
      
      // También refrescar la lista general en segundo plano
      get().fetchPrestamos(); 

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error managing return:", error);
      const msg = error.response?.data?.detail || "Error al procesar la devolución.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  clearItemsPrestables: () => set({ itemsPrestables: [] }),
  clearCurrentPrestamo: () => set({ currentPrestamo: null }),
}));