// Basado en models.py
export type EstadoOrden = 'PENDIENTE' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA';
export type TipoOrden = 'PROGRAMADA' | 'CORRECTIVA';
export type AccionOrden = 'iniciar' | 'finalizar' | 'cancelar';

// Resumen para la lista (MantenimientoOrdenListAPIView)
export interface OrdenResumen {
  id: number;
  titulo: string;
  tipo: string; // Display name
  tipo_codigo: TipoOrden;
  estado: string; // Display name
  estado_codigo: EstadoOrden;
  fecha_programada: string;
  responsable: string;
  es_vencido: boolean;
  activos_count: number;
}

// Ítem dentro del detalle (MantenimientoOrdenDetalleAPIView -> items)
export interface ItemOrden {
  id: string; // ID del activo (UUID como string)
  codigo: string;
  nombre: string;
  ubicacion: string;
  estado_trabajo: 'PENDIENTE' | 'COMPLETADO';
  estado_color: string; // 'green' | 'gray'
  registro_id: number | null;
  imagen_url?: string; // Opcional si el backend lo manda
}

// Detalle completo (MantenimientoOrdenDetalleAPIView)
export interface OrdenDetalleFull {
  cabecera: {
    id: number;
    titulo: string;
    descripcion: string;
    tipo: string;
    estado: string;
    estado_codigo: EstadoOrden;
    fecha_programada: string;
    responsable: string;
  };
  progreso: {
    total: number;
    completados: number;
    porcentaje: number;
    texto: string;
  };
  items: ItemOrden[];
}

// Payloads
export interface CrearOrdenPayload {
  descripcion: string; // Obligatorio
  fecha_programada?: string; // YYYY-MM-DD
  responsable_id?: number;
}

export interface RegistrarTareaPayload {
  activo_id: string; // UUID
  notas: string;
  exitoso?: boolean; // Default True
}

// Respuesta de búsqueda de activo
export interface ActivoBusquedaOrden {
    id: number; // ID numérico del activo según tu vista 'MantenimientoBuscarActivoParaOrdenAPIView'
    // ERROR MÍO: Tu vista 'MantenimientoBuscarActivoParaOrdenAPIView' devuelve 'id' como el ID del activo.
    // Si tus activos usan UUID, asegúrate que el backend devuelva el UUID o el ID numérico correcto.
    // Tu vista dice: 'id': activo.id. Si activo.id es UUID, esto será string.
    // Asumiré string para seguridad.
    codigo: string;
    nombre: string;
    ubicacion: string;
    imagen_url: string | null;
}