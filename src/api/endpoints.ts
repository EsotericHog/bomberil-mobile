export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login/',
    REFRESH: 'auth/refresh/',
    ME: 'auth/me/',
    LOGOUT: 'auth/logout/',
    PASSWORD_RESET: 'auth/password_reset/',
  },
  INVENTARIO: {
    EXISTENCIA_BUSCAR: (codigo: string) => `gestion_inventario/existencias/buscar/?codigo=${codigo}`,
    CATALOGO_STOCK: (search: string = '') => `gestion_inventario/catalogo/stock/?search=${search}`,
    EXISTENCIAS_POR_PRODUCTO: (productoId: number) => `gestion_inventario/existencias/?producto=${productoId}`,
    RECEPCION_STOCK: 'gestion_inventario/movimientos/recepcion/',
    AJUSTAR_STOCK: 'gestion_inventario/movimientos/ajustar/',
    CONSUMIR_STOCK: 'gestion_inventario/movimientos/consumir/',
    BAJA_EXISTENCIA: 'gestion_inventario/movimientos/baja/',
    EXTRAVIO_ACTIVO: 'gestion_inventario/movimientos/extravio/',
    ANULAR_EXISTENCIA: 'gestion_inventario/movimientos/anular/',

    // Rutas Auxiliares / Core
    CORE_UBICACIONES: (soloFisicas: boolean = false) => `gestion_inventario/core/ubicaciones/?solo_fisicas=${soloFisicas}`,
    CORE_COMPARTIMENTOS: (ubicacionId: string) => `gestion_inventario/core/compartimentos/?ubicacion=${ubicacionId}`,
    CORE_PROVEEDORES: (search: string = '') => `gestion_inventario/core/proveedores/?search=${search}`,

    PRODUCTOS: 'inventario/productos/',
    MOVIMIENTOS: 'inventario/movimientos/',
    EXISTENCIAS: 'inventario/existencias/',

    // --- PRÉSTAMOS ---
    PRESTAMOS_HISTORIAL: (todos: boolean = true, search: string = '') => `gestion_inventario/prestamos/?todos=${todos}&search=${search}`,
    PRESTAMOS_DESTINATARIOS: 'gestion_inventario/destinatarios/',
    PRESTAMOS_BUSCAR_ITEMS: (search: string = '') => `gestion_inventario/prestamo/buscar-prestables/?q=${search}`, // Asumimos param 'q' para búsqueda
    PRESTAMOS_CREAR: 'gestion_inventario/prestamos/crear/',
    PRESTAMOS_DEVOLUCION: (id: number) => `gestion_inventario/prestamos/${id}/devolucion/`,
  },
  MANTENIMIENTO: {
    // Lista: /api/v1/mantenimiento/ordenes/?estado=activos&q=...
    LISTA_ORDENES: (estado: 'activos' | 'historial' = 'activos', q: string = '') => 
      `gestion_mantenimiento/ordenes/?estado=${estado}&q=${q}`,
    
    // Crear: /api/v1/mantenimiento/ordenes/crear/
    CREAR_ORDEN: 'gestion_mantenimiento/ordenes/crear/',
    
    // Detalle: /api/v1/mantenimiento/ordenes/<pk>/detalle/
    DETALLE_ORDEN: (id: number) => `gestion_mantenimiento/ordenes/${id}/detalle/`,
    
    // Acciones Globales: /api/v1/gestion_mantenimiento/ordenes/<pk>/cambiar-estado/
    CAMBIAR_ESTADO: (id: number) => `gestion_mantenimiento/ordenes/${id}/cambiar-estado/`,
    
    // Gestión Activos:
    BUSCAR_ACTIVO: (ordenId: number, q: string) => `gestion_mantenimiento/ordenes/buscar-activo/?orden_id=${ordenId}&q=${q}`,
    ANADIR_ACTIVO: (id: number) => `gestion_mantenimiento/ordenes/${id}/anadir-activo/`,
    QUITAR_ACTIVO: (id: number) => `gestion_mantenimiento/ordenes/${id}/quitar-activo/`,
    
    // Registrar Tarea: /api/v1/gestion_mantenimiento/ordenes/<pk>/registrar-tarea/
    REGISTRAR_TAREA: (id: number) => `gestion_mantenimiento/ordenes/${id}/registrar-tarea/`,
  },
  USUARIOS: {
    // Lista: /api/v1/gestion_usuarios/lista/?q=...
    LISTA: (q: string = '', rol?: string) => `gestion_usuarios/lista/?q=${q}${rol ? `&rol=${rol}` : ''}`,
    
    // Detalle: /api/v1/usuarios/<uuid>/detalle/
    DETALLE: (id: string) => `gestion_usuarios/${id}/detalle/`,
    
    // Hoja Vida: /api/v1/voluntarios/<uuid>/hoja-vida/
    HOJA_VIDA: (id: string) => `gestion_usuarios/${id}/hoja-vida/`,
    
    // Ficha Médica: /api/v1/usuarios/<uuid>/ficha-medica/
    FICHA_MEDICA: (id: string) => `gestion_usuarios/${id}/ficha-medica/`,
  },
  DOCUMENTAL: {
    // URL: /api/v1/documental/documentos/?q=acta&tipo=1
    LISTA_DOCUMENTOS: (q: string = '', tipo?: number) => 
      `gestion_documental/documentos/?q=${q}${tipo ? `&tipo=${tipo}` : ''}`,
  },
  VOLUNTARIOS: {
    HOJA_VIDA: 'voluntarios/hoja-vida/',
    FICHA_MEDICA: 'voluntarios/ficha-medica/',
  },
  CORE: {
    ESTACIONES: 'core/estaciones/',
  }
} as const;