import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { 
  Existencia, 
  ProductoStock, 
  RecepcionPayload, 
  Proveedor, 
  Ubicacion, 
  Compartimento, 
  AjusteStockPayload,
  ConsumoStockPayload,
  BajaPayload,
  ExtravioPayload
} from '@/features/inventario/types';
import { Alert } from 'react-native';

interface InventoryState {
  currentExistencia: Existencia | null;
  catalogo: ProductoStock[];
  existenciasProducto: [],
  isLoading: boolean;
  error: string | null;
  // Estados para selectores
  proveedores: Proveedor[];
  ubicaciones: Ubicacion[];
  compartimentos: Compartimento[]; // Esta lista cambiará según la ubicación seleccionada

  // Acciones
  fetchExistenciaByQR: (codigo: string) => Promise<boolean>;
  fetchCatalogo: (search?: string) => Promise<void>;
  fetchExistenciasPorProducto: (productoId: number) => Promise<void>;
  recepcionarStock: (payload: RecepcionPayload) => Promise<boolean>;
  ajustarStock: (payload: AjusteStockPayload) => Promise<boolean>;
  consumirStock: (payload: ConsumoStockPayload) => Promise<boolean>;
  darDeBajaExistencia: (notas: string) => Promise<boolean>;
  reportarExtravio: (notas: string) => Promise<boolean>;
  clearCurrentExistencia: () => void;
  clearExistenciasProducto: () => void;

  // Acciones para selectores
  fetchProveedores: (search?: string) => Promise<void>;
  fetchUbicaciones: (soloFisicas?: boolean) => Promise<void>;
  fetchCompartimentos: (ubicacionId: string) => Promise<void>;
  clearCompartimentos: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  currentExistencia: null,
  catalogo: [],
  existenciasProducto: [],
  isLoading: false,
  error: null,
  proveedores: [],
  ubicaciones: [],
  compartimentos: [],

  fetchExistenciaByQR: async (codigo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.EXISTENCIA_BUSCAR(codigo));
      const data = response.data; 
      
      // Si la búsqueda devuelve una lista, tomamos el primero.
      // Si devuelve un objeto directo, lo usamos.
      let existencia: Existencia;
      
      if (Array.isArray(data)) {
        if (data.length === 0) throw new Error("No se encontró ninguna existencia con ese código.");
        existencia = data[0];
      } else {
        existencia = data;
      }

      set({ currentExistencia: existencia, isLoading: false });
      return true;

    } catch (error: any) {
      console.log("Error fetching existencia:", error);
      const msg = error.response?.data?.detail || error.message || "Error al buscar existencia";
      
      set({ error: msg, isLoading: false, currentExistencia: null });
      Alert.alert("Error", msg);
      return false;
    }
  },

  // Acción conectada al endpoint agrupado
  fetchCatalogo: async (search = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.CATALOGO_STOCK(search));
      // El backend devuelve una lista directa: [ {id, nombre...}, ... ]
      set({ catalogo: response.data, isLoading: false });
    } catch (error: any) {
      console.log("Error fetching catalog:", error);
      set({ error: "No se pudo cargar el catálogo", isLoading: false });
    }
  },

  fetchExistenciasPorProducto: async (productoId: number) => {
    set({ isLoading: true, error: null, existenciasProducto: [] }); // Limpiamos antes de cargar
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.EXISTENCIAS_POR_PRODUCTO(productoId));
      // Asumimos paginación estándar de DRF o lista directa
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      set({ existenciasProducto: data, isLoading: false });
    } catch (error: any) {
      console.log("Error fetching items by product:", error);
      set({ error: "No se pudieron cargar las existencias.", isLoading: false });
    }
  },

  recepcionarStock: async (payload: RecepcionPayload) => {
    set({ isLoading: true, error: null });
    try {
      // POST al endpoint transaccional
      await client.post(ENDPOINTS.INVENTARIO.RECEPCION_STOCK, payload);
      
      // Si todo sale bien
      set({ isLoading: false });
      return true;
      
    } catch (error: any) {
      console.log("Error en recepción:", error);
      // Extraemos el mensaje de error útil del backend (ej: "Falta proveedor_id")
      const msg = error.response?.data?.detail || error.message || "Error al procesar la recepción.";
      
      set({ error: msg, isLoading: false });
      Alert.alert("Error de Recepción", msg);
      return false;
    }
  },

  ajustarStock: async (payload: AjusteStockPayload) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(ENDPOINTS.INVENTARIO.AJUSTAR_STOCK, payload);
      
      // Si tuvo éxito, recargamos la existencia actual para ver el cambio reflejado
      const current = get().currentExistencia;
      if (current) {
        await get().fetchExistenciaByQR(current.codigo);
      }
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error ajustando stock:", error);
      const msg = error.response?.data?.detail || "Error al realizar el ajuste.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  consumirStock: async (payload: ConsumoStockPayload) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(ENDPOINTS.INVENTARIO.CONSUMIR_STOCK, payload);
      
      // Recargar datos para ver el stock actualizado
      const current = get().currentExistencia;
      if (current) {
        await get().fetchExistenciaByQR(current.codigo);
      }
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error consumiendo stock:", error);
      const msg = error.response?.data?.detail || "Error al registrar el consumo.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  darDeBajaExistencia: async (notas: string) => {
    const current = get().currentExistencia;
    if (!current) return false;

    set({ isLoading: true, error: null });

    try {
      // Mapeo de tipos Frontend -> Backend
      const tipoBackend = current.tipo_existencia === 'LOTE' ? 'LOTE' : 'ACTIVO';

      const payload: BajaPayload = {
        id: current.id.toString(),
        tipo: tipoBackend as 'ACTIVO' | 'LOTE',
        notas: notas
      };

      await client.post(ENDPOINTS.INVENTARIO.BAJA_EXISTENCIA, payload);
      
      // Recargar datos para ver el nuevo estado "DE BAJA"
      await get().fetchExistenciaByQR(current.codigo);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error dando de baja:", error);
      const msg = error.response?.data?.detail || "Error al procesar la baja.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  reportarExtravio: async (notas: string) => {
    const current = get().currentExistencia;
    if (!current || current.tipo_existencia !== 'ACTIVO') return false;

    set({ isLoading: true, error: null });

    try {
      const payload: ExtravioPayload = {
        id: current.id.toString(),
        notas: notas
      };

      await client.post(ENDPOINTS.INVENTARIO.EXTRAVIO_ACTIVO, payload);
      
      // Recargar datos para ver estado "EXTRAVIADO"
      await get().fetchExistenciaByQR(current.codigo);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.log("Error reportando extravío:", error);
      const msg = error.response?.data?.detail || "Error al reportar el extravío.";
      set({ error: msg, isLoading: false });
      Alert.alert("Error", msg);
      return false;
    }
  },

  clearCurrentExistencia: () => set({ currentExistencia: null, error: null }),
  clearExistenciasProducto: () => set({ existenciasProducto: [], error: null }),

  fetchProveedores: async (search = '') => {
    // No activamos isLoading global para no bloquear toda la UI si es un dropdown
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.CORE_PROVEEDORES(search));
      set({ proveedores: response.data });
    } catch (error) {
      console.log("Error fetching proveedores", error);
    }
  },

  fetchUbicaciones: async (soloFisicas = true) => {
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.CORE_UBICACIONES(soloFisicas));
      set({ ubicaciones: response.data });
    } catch (error) {
      console.log("Error fetching ubicaciones", error);
    }
  },

  fetchCompartimentos: async (ubicacionId: string) => {
    // Aquí podríamos tener un loading local si quisiéramos
    set({ compartimentos: [] }); // Limpiar anteriores
    try {
      const response = await client.get(ENDPOINTS.INVENTARIO.CORE_COMPARTIMENTOS(ubicacionId));
      set({ compartimentos: response.data });
    } catch (error) {
      console.log("Error fetching compartimentos", error);
    }
  },

  clearCompartimentos: () => set({ compartimentos: [] }),
}));