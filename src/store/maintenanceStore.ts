import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { 
  OrdenResumen, OrdenDetalleFull, CrearOrdenPayload, RegistrarTareaPayload, 
  AccionOrden, ActivoBusquedaOrden 
} from '@/features/mantenimiento/types';
import { Alert } from 'react-native';

interface MaintenanceState {
  ordenes: OrdenResumen[];
  currentOrden: OrdenDetalleFull | null;
  activosBusqueda: ActivoBusquedaOrden[]; // Resultados search
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchOrdenes: (estado?: 'activos' | 'historial', q?: string) => Promise<void>;
  fetchDetalleOrden: (id: number) => Promise<void>;
  crearOrden: (payload: CrearOrdenPayload) => Promise<number | null>; // Retorna ID si éxito
  
  cambiarEstadoOrden: (id: number, accion: AccionOrden) => Promise<boolean>;
  
  buscarActivosParaOrden: (ordenId: number, query: string) => Promise<void>;
  anadirActivoAOrden: (ordenId: number, activoId: string) => Promise<boolean>;
  quitarActivoDeOrden: (ordenId: number, activoId: string) => Promise<boolean>;
  
  registrarTarea: (ordenId: number, payload: RegistrarTareaPayload) => Promise<boolean>;
  
  clearCurrentOrden: () => void;
  clearBusqueda: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  ordenes: [],
  currentOrden: null,
  activosBusqueda: [],
  isLoading: false,
  error: null,

  fetchOrdenes: async (estado = 'activos', q = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.MANTENIMIENTO.LISTA_ORDENES(estado, q));
      set({ ordenes: response.data, isLoading: false });
    } catch (error) {
      console.log("Error fetchOrdenes", error);
      set({ error: "Error cargando lista", isLoading: false });
    }
  },

  fetchDetalleOrden: async (id) => {
    set({ isLoading: true, error: null, currentOrden: null });
    try {
      const response = await client.get(ENDPOINTS.MANTENIMIENTO.DETALLE_ORDEN(id));
      set({ currentOrden: response.data, isLoading: false });
    } catch (error) {
      console.log("Error fetchDetalleOrden", error);
      set({ error: "Error cargando detalle", isLoading: false });
    }
  },

  crearOrden: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await client.post(ENDPOINTS.MANTENIMIENTO.CREAR_ORDEN, payload);
      set({ isLoading: false });
      return response.data.id; // Backend devuelve { "id": 123, ... }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Error al crear orden");
      set({ isLoading: false });
      return null;
    }
  },

  cambiarEstadoOrden: async (id, accion) => {
    set({ isLoading: true });
    try {
      // Backend espera: POST { accion: 'iniciar' }
      await client.post(ENDPOINTS.MANTENIMIENTO.CAMBIAR_ESTADO(id), { accion });
      
      // Refrescar detalle tras cambio
      await get().fetchDetalleOrden(id);
      // Refrescar lista global background
      get().fetchOrdenes();
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.detail || "Error cambiando estado";
      Alert.alert("Error", msg);
      set({ isLoading: false });
      return false;
    }
  },

  buscarActivosParaOrden: async (ordenId, query) => {
    if (!query || query.length < 2) return;
    set({ isLoading: true });
    try {
      const response = await client.get(ENDPOINTS.MANTENIMIENTO.BUSCAR_ACTIVO(ordenId, query));
      set({ activosBusqueda: response.data.results || [], isLoading: false }); // Backend devuelve { results: [] }
    } catch (error) {
      set({ activosBusqueda: [], isLoading: false });
    }
  },

  anadirActivoAOrden: async (ordenId, activoId) => {
    try {
      await client.post(ENDPOINTS.MANTENIMIENTO.ANADIR_ACTIVO(ordenId), { activo_id: activoId });
      // Refrescar detalle para ver el activo añadido
      await get().fetchDetalleOrden(ordenId);
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "No se pudo agregar");
      return false;
    }
  },

  quitarActivoDeOrden: async (ordenId, activoId) => {
    try {
      await client.post(ENDPOINTS.MANTENIMIENTO.QUITAR_ACTIVO(ordenId), { activo_id: activoId });
      await get().fetchDetalleOrden(ordenId);
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "No se pudo quitar");
      return false;
    }
  },

  registrarTarea: async (ordenId, payload) => {
    set({ isLoading: true });
    try {
      // Backend espera: { activo_id, notas, exitoso }
      await client.post(ENDPOINTS.MANTENIMIENTO.REGISTRAR_TAREA(ordenId), payload);
      await get().fetchDetalleOrden(ordenId); // Refrescar para ver el item como COMPLETADO
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "No se pudo registrar tarea");
      set({ isLoading: false });
      return false;
    }
  },

  clearCurrentOrden: () => set({ currentOrden: null }),
  clearBusqueda: () => set({ activosBusqueda: [] }),
}));