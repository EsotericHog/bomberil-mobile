// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';

// Placeholders (Crea archivos básicos para que no de error)
import DashboardScreen from '@/features/dashboard/DashboardScreen'; // El Portal 
import InventarioScreen from '@/features/inventario/InventarioScreen';
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
        name="MiPerfil" 
        component={PerfilScreen} 
        options={{ headerShown: false }}
      />
      {/* Agrega las demás rutas aquí a medida que las crees */}
    </Stack.Navigator>
  );
};