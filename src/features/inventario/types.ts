export interface Movimiento {
  id: number;
  fecha: string; // ISO date
  tipo: string; // "ENTRADA", "SALIDA", etc.
  usuario: string;
  origen: string;
  destino: string;
}

export interface UsoStats {
  total_horas: number;
  ultimo_uso: string | null;
  total_registros: number;
}

export interface MantenimientoStats {
  ordenes_activas_count: number;
  en_taller: boolean;
}

// Interfaz unificada basada en tu respuesta del backend (data_response)
export interface Existencia {
  tipo_existencia: 'ACTIVO' | 'LOTE'; // Backend envía esto ahora
  id: number;
  sku: string;
  codigo: string;
  nombre: string;
  marca: string;
  ubicacion: string;
  estado: string;
  estado_color: string; // "green" | "red" | "orange"
  imagen: string | null;

  // Específicos de ACTIVO
  modelo?: string;
  serie?: string;
  uso_stats?: UsoStats | null;
  mantenimiento?: MantenimientoStats | null;

  // Específicos de LOTE
  cantidad_actual?: number;
  unidad_medida?: string;
  vencimiento?: string | null;
  lote_fabricacion?: string;

  // Historial
  historial_movimientos: Movimiento[];
}

// Interfaz para el listado de productos agrupados
export interface ProductoStock {
  id: number; // ID del Producto Local
  nombre: string;
  marca: string;
  sku: string;
  categoria: string;
  es_activo: boolean; // true = Activo, false = Insumo/Lote
  stock_total: number;
  imagen: string | null;
  critico: boolean; // Para pintar en rojo si el stock es bajo
}

// Estructura de una línea de detalle en la recepción
export interface DetalleRecepcionItem {
  producto_id: number;
  nombre_producto?: string; // Auxiliar para mostrar en la UI antes de enviar
  compartimento_destino_id: number | string; // ID o UUID según tu backend
  cantidad: number;
  costo_unitario: number;
  
  // Opcionales según tipo
  numero_serie?: string;      // Solo Activos
  fecha_fabricacion?: string; // Solo Activos (YYYY-MM-DD)
  numero_lote?: string;       // Solo Lotes
  fecha_vencimiento?: string; // Solo Lotes (YYYY-MM-DD)
}

// Estructura del Payload completo para el POST
export interface RecepcionPayload {
  proveedor_id: number;
  fecha_recepcion: string; // YYYY-MM-DD
  notas?: string;
  detalles: DetalleRecepcionItem[];
}

// Modelos para selectores
export interface Proveedor {
  id: number;
  nombre: string;
  rut: string;
  es_local: boolean;
}

export interface Ubicacion {
  id: string; // UUID
  nombre: string;
  tipo: string;
  codigo: string;
}

export interface Compartimento {
  id: string; // UUID
  nombre: string;
  codigo: string;
}