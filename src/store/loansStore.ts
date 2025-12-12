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
  fetchItemByCode: (code: string) => Promise<ItemPrestable | null>;
  
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
    set({ isLoading: true });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_BUSCAR_ITEMS(query));
      
      // FIX: Acceder a .items dentro de data
      const results = response.data.items || []; 
      
      // Mapear al formato interno ItemPrestable si es necesario
      // El backend devuelve 'real_id', 'texto_mostrar', 'max_qty'.
      // Nuestra interfaz ItemPrestable espera: id, codigo, nombre, tipo, ubicacion, cantidad_disponible
      // Hacemos un mapeo rápido para adaptar la respuesta del backend al frontend
      const mappedItems: ItemPrestable[] = results.map((i: any) => ({
        id: i.real_id, // Usamos el UUID real
        tipo: i.tipo === 'activo' ? 'ACTIVO' : 'LOTE',
        codigo: i.codigo,
        nombre: i.nombre,
        ubicacion: 'N/A', // El backend actual no devuelve ubicación explícita en este endpoint, podemos ajustarlo luego
        cantidad_disponible: i.max_qty,
        marca: ''
      }));

      set({ itemsPrestables: mappedItems, isLoading: false });
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

  fetchItemByCode: async (code: string) => {
    set({ isLoading: true });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.PRESTAMOS_BUSCAR_ITEMS(code));
      
      // FIX: Acceder a .items
      const results = response.data.items || [];

      if (Array.isArray(results) && results.length > 0) {
        // Buscar coincidencia exacta
        const exactMatch = results.find((i: any) => i.codigo.toUpperCase() === code.toUpperCase());
        const found = exactMatch || results[0];

        // Mapear al formato frontend
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