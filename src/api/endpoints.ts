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

    // Rutas Auxiliares / Core
    CORE_UBICACIONES: (soloFisicas: boolean = true) => `gestion_inventario/core/ubicaciones/?solo_fisicas=${soloFisicas}`,
    CORE_COMPARTIMENTOS: (ubicacionId: string) => `gestion_inventario/core/compartimentos/?ubicacion=${ubicacionId}`,
    CORE_PROVEEDORES: (search: string = '') => `gestion_inventario/core/proveedores/?search=${search}`,

    PRODUCTOS: 'inventario/productos/',
    MOVIMIENTOS: 'inventario/movimientos/',
    EXISTENCIAS: 'inventario/existencias/',
  },
  VOLUNTARIOS: {
    HOJA_VIDA: 'voluntarios/hoja-vida/',
    FICHA_MEDICA: 'voluntarios/ficha-medica/',
  },
  CORE: {
    ESTACIONES: 'core/estaciones/',
  }
} as const;