// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';

// Placeholders (Crea archivos básicos para que no de error)
import DashboardScreen from '@/features/dashboard/DashboardScreen'; // El Portal 
import InventarioScreen from '@/features/inventario/InventarioScreen';
import ScannerScreen from '@/features/inventario/ScannerScreen';
import CatalogoLocalScreen from '@/features/inventario/CatalogoLocalScreen';
import ExistenciasPorProductoScreen from '@/features/inventario/ExistenciasPorProductoScreen';
import ExistenciaDetailScreen from '@/features/inventario/ExistenciaDetailScreen';
import RecepcionStockScreen from '@/features/inventario/RecepcionStockScreen';
import PrestamosHomeScreen from '@/features/inventario/prestamos/PrestamosHomeScreen';
import CrearPrestamoScreen from '@/features/inventario/prestamos/CrearPrestamoScreen';
import DetallePrestamoScreen from '@/features/inventario/prestamos/DetallePrestamoScreen';
import MantenimientoListScreen from '@/features/mantenimiento/MantenimientoListScreen';
import CrearOrdenScreen from '@/features/mantenimiento/CrearOrdenScreen';
import DetalleOrdenScreen from '@/features/mantenimiento/DetalleOrdenScreen';
import DocumentalListScreen from '@/features/documental/DocumentalListScreen';
import PerfilScreen from '@/features/perfil/PerfilScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{ 
        headerStyle: { backgroundColor: '#B71C1C' }, // Color Bomberos
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Bomberil System' }} 
      />
      <Stack.Screen 
        name="InventarioHome" 
        component={InventarioScreen} 
        options={{ title: 'Gestión de Inventario' }} 
      />
      <Stack.Screen 
        name="ScannerInventario" 
        component={ScannerScreen} 
        options={{ headerShown: false, animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="CatalogoLocal" 
        component={CatalogoLocalScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ExistenciasPorProducto" 
        component={ExistenciasPorProductoScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="DetalleExistencia" 
        component={ExistenciaDetailScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RecepcionStock" 
        component={RecepcionStockScreen} 
        options={{ title: 'Nueva Recepción' }} // O headerShown: false si prefieres tu propio header
      />
      <Stack.Screen 
        name="PrestamosHome" 
        component={PrestamosHomeScreen} 
        options={{ title: 'Gestión de Préstamos' }} // O headerShown: false si usas header custom
      />
      <Stack.Screen 
        name="CrearPrestamo" 
        component={CrearPrestamoScreen} 
        options={{ title: 'Nuevo Préstamo', presentation: 'modal' }} // Modal para indicar que es un proceso
      />
      <Stack.Screen 
        name="DetallePrestamo" 
        component={DetallePrestamoScreen} 
        options={{ headerShown: false }} // El componente ya tiene su propio header custom
      />
      <Stack.Screen 
        name="MantenimientoList" 
        component={MantenimientoListScreen} 
        options={{ title: 'Órdenes de Trabajo' }} 
      />
      <Stack.Screen 
        name="CrearOrden" 
        component={CrearOrdenScreen} 
        options={{ title: 'Nueva Orden Correctiva', presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="DetalleOrden" 
        component={DetalleOrdenScreen} 
        options={{ headerShown: false }} // Usamos header custom en la pantalla
      />
      <Stack.Screen 
        name="DocumentalList" 
        component={DocumentalListScreen} 
        options={{ title: 'Biblioteca Digital' }} 
      />
      <Stack.Screen 
        name="MiPerfil" 
        component={PerfilScreen} 
        options={{ headerShown: false }}
      />
      {/* Agrega las demás rutas aquí a medida que las crees */}
    </Stack.Navigator>
  );
};