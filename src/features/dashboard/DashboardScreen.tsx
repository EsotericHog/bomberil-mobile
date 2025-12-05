import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { signOut, hasPermission } = useAuthStore();
  
  // Validamos permiso basado en la regla de roles personalizados [cite: 18]
  // Usamos nomenclatura 'accion_...' 
  const puedeVerInventario = hasPermission('accion_ver_inventario');

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'space-around' }}>
      <Text style={{ fontSize: 20, textAlign: 'center' }}>Portal Móvil</Text>

      {/* 1. MÓDULO MI CUENTA (Accesible para todos) [cite: 8] */}
      <View>
        <Button 
          title="Mi Cuenta / Hoja de Vida" 
          onPress={() => navigation.navigate('MiPerfil')} 
        />
        <Text>Ver mis datos médicos y bomberiles</Text>
      </View>

      {/* 2. MÓDULO INVENTARIO (Restringido por permisos) [cite: 24] */}
      {puedeVerInventario ? (
        <View>
          <Button 
            title="Gestión de Inventario" 
            onPress={() => navigation.navigate('InventarioHome')} 
          />
          <Text>Control de stock y escaneo QR</Text>
        </View>
      ) : (
        <Text style={{ color: 'red' }}>No tienes acceso al inventario en esta estación</Text>
      )}

      {/* 3. MÓDULO DOCUMENTACIÓN (Accesible para todos en la estación) [cite: 8] */}
      <View>
        <Button 
          title="Documentación y Manuales" 
          onPress={() => console.log('Navegar a docs...')} 
        />
      </View>

      <Button title="Cerrar Sesión" color="red" onPress={signOut} />
    </View>
  );
}