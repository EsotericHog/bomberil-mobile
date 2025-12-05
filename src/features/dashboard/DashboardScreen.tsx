import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const { user, signOut, hasPermission } = useAuthStore();

  // Validamos permisos específicos
  const puedeVerInventario = hasPermission('accion_ver_inventario');

  // Componente de Tarjeta de Menú Reutilizable
  const MenuCard = ({ title, subtitle, icon, color, onPress, disabled = false }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row items-center ${disabled ? 'opacity-50' : ''}`}
    >
      <View className={`p-4 rounded-xl ${color} mr-4`}>
        <Feather name={icon} size={24} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800">{title}</Text>
        <Text className="text-gray-400 text-xs mt-1">{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView className="flex-1">
        
        {/* --- HEADER --- */}
        <View className="px-6 py-6 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400 text-sm font-medium">Bienvenido,</Text>
            <Text className="text-2xl font-extrabold text-gray-900">
              {user?.email ? user.email.split('@')[0] : 'Voluntario'}
            </Text>
            <Text className="text-bomberil-700 text-xs font-bold mt-1">
              SEGUNDA COMPAÑÍA IQUIQUE
            </Text>
          </View>
          <TouchableOpacity 
            onPress={signOut}
            className="bg-gray-200 p-3 rounded-full"
          >
            <Feather name="log-out" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* --- GRID DE MÓDULOS --- */}
        <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
          
          <Text className="text-gray-500 font-bold mb-4 uppercase text-xs tracking-wider">
            Mi Gestión
          </Text>

          {/* 1. Módulo MI PERFIL (Para todos) */}
          <MenuCard 
            title="Mi Hoja de Vida" 
            subtitle="Historial, ficha médica y datos"
            icon="user"
            color="bg-blue-600"
            onPress={() => navigation.navigate('MiPerfil')}
          />

          {/* 2. Módulo INVENTARIO (Condicional) */}
          {puedeVerInventario ? (
            <MenuCard 
              title="Inventario & Activos" 
              subtitle="Escanear, mover y auditar"
              icon="box"
              color="bg-bomberil-700" // Rojo corporativo
              onPress={() => navigation.navigate('InventarioHome')}
            />
          ) : (
            // Opcional: Mostrar deshabilitado o no mostrar nada
            <View className="bg-gray-100 p-4 rounded-xl mb-4 border border-gray-200 border-dashed items-center flex-row">
               <Feather name="lock" size={16} color="#9ca3af" />
               <Text className="text-gray-400 text-xs ml-2">Acceso a inventario restringido</Text>
            </View>
          )}

          {/* 3. Módulo DOCUMENTACIÓN */}
          <MenuCard 
            title="Biblioteca Digital" 
            subtitle="Manuales y protocolos"
            icon="book-open"
            color="bg-amber-500"
            onPress={() => console.log('Ir a Docs')}
          />

          <Text className="text-gray-500 font-bold mb-4 mt-4 uppercase text-xs tracking-wider">
            Utilidades
          </Text>

          {/* Botón rápido para scanner genérico si fuera necesario */}
          <MenuCard 
            title="Escáner Rápido" 
            subtitle="Leer QR sin contexto"
            icon="maximize"
            color="bg-gray-800"
            onPress={() => console.log('Scanner')}
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}