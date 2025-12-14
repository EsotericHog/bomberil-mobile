import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { PrestamoResumen, Destinatario, ItemPrestable, CrearPrestamoPayload, PrestamoFull, GestionarDevolucionPayload } from '@/features/inventario/types';
import { Alert } from 'react-native';

interface LoansState {
  prestamos: PrestamoResumen[];
  destinatarios: Destinatario[];
  itemsPrestables: ItemPrestable[]; 
  currentPrestamo: PrestamoFull | null;
  isLoading: boolean;
  error: string | null;

  fetchPrestamos: (todos?: boolean, search?: string) => Promise<void>;
  fetchDestinatarios: () => Promise<void>;
  fetchItemsPrestables: (query: string) => Promise<void>;
  // CAMBIO: Promise<boolean>
  fetchDetallePrestamo: (id: number) => Promise<boolean>;
  fetchItemByCode: (code: string) => Promise<ItemPrestable | null>;
  
  crearPrestamo: (payload: CrearPrestamoPayload) => Promise<boolean>;
  gestionarDevolucion: (id: number, payload: GestionarDevolucionPayload) => Promise<boolean>;
  
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
    set({ isLoading: true });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_BUSCAR_ITEMS(query));
      const results = response.data.items || []; 
      
      const mappedItems: ItemPrestable[] = results.map((i: any) => ({
        id: i.real_id,
        tipo: i.tipo === 'activo' ? 'ACTIVO' : 'LOTE',
        codigo: i.codigo,
        nombre: i.nombre,
        ubicacion: 'N/A',
        cantidad_disponible: i.max_qty,
        marca: ''
      }));

      set({ itemsPrestables: mappedItems, isLoading: false });
    } catch (error) {
      console.log("Error buscando items prestables:", error);
      set({ itemsPrestables: [], isLoading: false });
    }
  },

  // --- LÓGICA MEJORADA ---
  fetchDetallePrestamo: async (id: number) => {
    set({ isLoading: true, error: null, currentPrestamo: null });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_DEVOLUCION(id));
      set({ currentPrestamo: response.data, isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error fetching loan detail:", error);
      
      const msg = error.response?.status === 403 
        ? "No tienes permiso para ver este préstamo."
        : "No se pudo cargar el detalle.";

      set({ error: msg, isLoading: false });
      return false;
    }
  },

  fetchItemByCode: async (code: string) => {
    set({ isLoading: true });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_BUSCAR_ITEMS(code));
      const results = response.data.items || [];

      if (Array.isArray(results) && results.length > 0) {
        const exactMatch = results.find((i: any) => i.codigo.toUpperCase() === code.toUpperCase());
        const found = exactMatch || results[0];

        const mappedItem: ItemPrestable = {
            id: found.real_id,
            tipo: found.tipo === 'activo' ? 'ACTIVO' : 'LOTE',
            codigo: found.codigo,
            nombre: found.nombre,
            ubicacion: 'N/A',
            cantidad_disponible: found.max_qty
        };

        set({ isLoading: false });
        return mappedItem;
      }
      
      set({ isLoading: false });
      return null;
    } catch (error) {
      console.log("Error fetching item by code:", error);
      set({ isLoading: false });
      return null;
    }
  },

  crearPrestamo: async (payload: CrearPrestamoPayload) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(ENDPOINTS.INVENTARIO.PRESTAMOS_CREAR, payload);
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
      await get().fetchDetallePrestamo(id);
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