import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Rutas para cuando el usuario NO está logueado
export type AuthStackParamList = {
  Login: undefined;
  RecuperarClave: undefined;
};

// Rutas para cuando está logueado
export type AppStackParamList = {
  Dashboard: undefined; // "Portal" 
  SeleccionEstacion: undefined; // Necesario porque el usuario accede vía Membresía
  InventarioHome: undefined; // Módulo Inventario
  ScannerInventario: undefined;
  CatalogoLocal: undefined;
  ExistenciasPorProducto: { productoId: number; nombreProducto: string };
  DetalleExistencia: { sku: string }; // Ejemplo de paso de parámetros
  RecepcionStock: undefined;

  PrestamosHome: undefined;
  CrearPrestamo: undefined; 
  DetallePrestamo: { id: number };
  
  VoluntariosHome: undefined; // Módulo Voluntarios
  FichaMedica: { voluntarioId?: number }; // Módulo Médico
  MiPerfil: undefined;
};

// Helper para usar en los componentes
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;