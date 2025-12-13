import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

// Interfaz para el componente de tarjeta (Mejora profesional)
interface MenuCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap; // Asegura que solo uses iconos válidos
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function DashboardScreen({ navigation }: Props) {
  // 1. Consumimos los datos frescos del Store (Sincronizados con backend)
  const { user, estacion, signOut, hasPermission } = useAuthStore();

  // 2. Verificamos el permiso de negocio real
  const puedeVerInventario = hasPermission('acceso_gestion_inventario');
  console.log(puedeVerInventario)
  const puedeVerDocumentacion = hasPermission('acceso_gestion_documental');
  console.log(puedeVerDocumentacion)
  const puedeVerMantenimiento = hasPermission('acceso_gestion_mantenimiento');

  // 3. Función de Logout con confirmación para evitar toques accidentales
  const handleSignOut = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: signOut }
      ]
    );
  };

  // Componente de Tarjeta de Menú Reutilizable
  const MenuCard = ({ title, subtitle, icon, color, onPress, disabled = false }: MenuCardProps) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row items-center ${disabled ? 'opacity-60 bg-gray-50' : ''}`}
    >
      <View className={`p-4 rounded-xl ${disabled ? 'bg-gray-400' : color} mr-4 shadow-sm`}>
        <Feather name={icon} size={24} color="white" />
      </View>
      <View className="flex-1">
        <Text className={`text-lg font-bold ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
          {title}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">{subtitle}</Text>
      </View>
      
      {disabled ? (
        <Feather name="lock" size={20} color="#9ca3af" />
      ) : (
        <Feather name="chevron-right" size={20} color="#d1d5db" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView className="flex-1">
        
        {/* --- HEADER --- */}
        <View className="px-6 py-6 flex-row justify-between items-center bg-white border-b border-gray-100 pb-8 rounded-b-3xl shadow-sm z-10">
          <View>
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
              Bienvenido a tu Estación
            </Text>
            <Text className="text-2xl font-extrabold text-gray-900" numberOfLines={1}>
              {user?.nombre_completo || 'Voluntario'}
            </Text>
            <View className="flex-row items-center mt-2">
              <Feather name="map-pin" size={12} color="#b91c1c" />
              <Text className="text-bomberil-700 text-xs font-bold ml-1">
                {estacion?.nombre || 'Sin Asignación Activa'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={handleSignOut}
            className="bg-gray-100 p-3 rounded-full border border-gray-200"
          >
            <Feather name="log-out" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* --- GRID DE MÓDULOS --- */}
        <ScrollView 
          className="flex-1 px-6 pt-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          
          <Text className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider ml-1">
            Mi Gestión Personal
          </Text>

          {/* 1. Módulo MI PERFIL (Disponible para todos) */}
          <MenuCard 
            title="Mi Hoja de Vida" 
            subtitle="Historial, ficha médica y datos"
            icon="user"
            color="bg-blue-600"
            onPress={() => navigation.navigate('MiPerfil')}
          />

          <Text className="text-gray-400 font-bold mb-4 mt-4 uppercase text-xs tracking-wider ml-1">
            Operaciones de Cuartel
          </Text>

          {/* 2. Módulo INVENTARIO (Protegido por Permiso) */}
          <MenuCard 
            title="Inventario & Activos" 
            subtitle={puedeVerInventario ? "Control de stock y movimientos" : "No tienes permisos de acceso"}
            icon="box"
            color="bg-bomberil-700"
            disabled={!puedeVerInventario} // Se deshabilita visualmente si no hay permiso
            onPress={() => navigation.navigate('InventarioHome')}
          />

          {/* 3. MANTENIMIENTO (NUEVO) */}
          <MenuCard 
            title="Mantenimiento" 
            subtitle={puedeVerMantenimiento ? "Órdenes de trabajo y tareas" : "No tienes permisos de acceso"}
            icon="tool"
            color="bg-purple-600"
            disabled={!puedeVerMantenimiento}
            onPress={() => navigation.navigate('MantenimientoList')}
          />

          {/* 4. Módulo DOCUMENTACIÓN (Placeholder) */}
          <MenuCard 
            title="Biblioteca Digital" 
            subtitle={puedeVerDocumentacion ? "Manuales y protocolos operativos" : "No tienes permisos de acceso"}
            icon="book-open"
            color="bg-amber-500"
            disabled={!puedeVerDocumentacion}
            onPress={() => Alert.alert("Próximamente", "El módulo de biblioteca estará disponible en la siguiente versión.")}
          />

          <Text className="text-gray-400 font-bold mb-4 mt-4 uppercase text-xs tracking-wider ml-1">
            Herramientas
          </Text>

          {/* Botón rápido para scanner genérico */}
          <MenuCard 
            title="Escáner Rápido" 
            subtitle="Leer QR sin contexto específico"
            icon="maximize"
            color="bg-gray-800"
            onPress={() => Alert.alert("Escáner", "Abriendo cámara para lectura general...")}
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}