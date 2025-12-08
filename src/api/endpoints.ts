export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login/',
    REFRESH: 'auth/refresh/',
    ME: 'auth/me/',
    LOGOUT: 'auth/logout/',
    PASSWORD_RESET: 'auth/password_reset/',
  },
  INVENTARIO: {
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