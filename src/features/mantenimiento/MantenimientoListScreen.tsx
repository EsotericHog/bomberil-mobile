import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore'; // Importar AuthStore
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { OrdenResumen } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'MantenimientoList'>;

export default function MantenimientoListScreen({ navigation }: Props) {
  const { ordenes, isLoading, fetchOrdenes } = useMaintenanceStore();
  const { hasPermission } = useAuthStore(); // Hook de permisos
  
  // Estado local
  const [tab, setTab] = useState<'activos' | 'historial'>('activos');
  const [searchText, setSearchText] = useState('');

  // --- PERMISOS ---
  const canManageOrders = hasPermission('accion_gestion_mantenimiento_gestionar_ordenes'); // Crear/Editar
  const canViewDetail = hasPermission('accion_gestion_mantenimiento_ver_ordenes'); // Ver detalle

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes(tab, searchText);
    }, [tab]) 
  );

  const handleSearch = () => {
    fetchOrdenes(tab, searchText);
  };

  const handleCreatePress = () => {
    if (!canManageOrders) {
      return Alert.alert("Acceso Denegado", "No tienes permisos para crear órdenes de trabajo.");
    }
    navigation.navigate('CrearOrden');
  };

  const handleItemPress = (id: number) => {
    if (!canViewDetail) {
      return Alert.alert("Acceso Denegado", "No tienes permisos para ver el detalle de la orden.");
    }
    navigation.navigate('DetalleOrden', { id });
  };

  const getStatusColor = (code: string) => {
    switch (code) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_CURSO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADA': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELADA': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const renderItem = ({ item }: { item: OrdenResumen }) => (
    <TouchableOpacity 
      className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm"
      onPress={() => handleItemPress(item.id)}
      activeOpacity={canViewDetail ? 0.7 : 1}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          
          <View className="flex-row flex-wrap gap-2 mb-1">
            {/* Tag Tipo */}
            {item.tipo_codigo === 'CORRECTIVA' && (
              <View className="bg-purple-100 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-bold text-purple-800">CORRECTIVA</Text>
              </View>
            )}
            
            {/* Tag RESPONSABILIDAD - Ahora usamos el campo del backend */}
            {item.es_responsable && (
              <View className="bg-indigo-100 px-2 py-0.5 rounded flex-row items-center border border-indigo-200">
                <Feather name="user-check" size={10} color="#3730a3" />
                <Text className="text-[10px] font-bold text-indigo-800 ml-1">ERES RESPONSABLE</Text>
              </View>
            )}
          </View>

          <Text className="font-bold text-gray-900 text-base" numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            #{item.id} • Responsable: {item.responsable}
          </Text>
        </View>
        
        <View className={`px-2 py-1 rounded-lg border ${getStatusColor(item.estado_codigo)}`}>
          <Text className="text-[10px] font-bold uppercase">{item.estado}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-50 mt-1">
        <View className="flex-row items-center">
          <Feather name="calendar" size={14} color="#6b7280" />
          <Text className={`text-xs ml-1 font-medium ${item.es_vencido ? 'text-red-600' : 'text-gray-600'}`}>
            {item.fecha_programada}
          </Text>
          {item.es_vencido && (
             <Text className="text-[10px] text-red-600 font-bold ml-1">(Vencido)</Text>
          )}
        </View>
        
        <View className="flex-row items-center">
            <Feather name="tool" size={14} color="#6b7280" />
            <Text className="text-xs ml-1 text-gray-500">{item.activos_count} activo(s)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 px-4 pt-2">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full">
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 ml-2">Mantenimiento</Text>
          </View>
          
          {/* Botón Nueva Correctiva (Protegido) */}
          <TouchableOpacity 
            onPress={handleCreatePress}
            disabled={!canManageOrders}
            className={`px-3 py-2 rounded-lg flex-row items-center shadow-sm ${canManageOrders ? 'bg-gray-900' : 'bg-gray-300'}`}
          >
            <Feather name={canManageOrders ? "plus" : "lock"} size={16} color="white" />
            <Text className="text-white font-bold text-xs ml-1">Correctiva</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2 mb-4 shadow-sm">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput 
              className="flex-1 ml-2 text-gray-800"
              placeholder="Buscar por ID, Plan o Descripción..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchText(''); fetchOrdenes(tab, ''); }}>
                    <Feather name="x" size={18} color="#9ca3af" />
                </TouchableOpacity>
            )}
        </View>
          
        {/* Tabs */}
        <View className="flex-row bg-gray-200 p-1 rounded-xl mb-4">
            <TouchableOpacity 
              onPress={() => setTab('activos')}
              className={`flex-1 py-2 rounded-lg items-center ${tab === 'activos' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-bold text-xs ${tab === 'activos' ? 'text-gray-900' : 'text-gray-500'}`}>
                Activas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTab('historial')}
              className={`flex-1 py-2 rounded-lg items-center ${tab === 'historial' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-bold text-xs ${tab === 'historial' ? 'text-gray-900' : 'text-gray-500'}`}>
                Historial
              </Text>
            </TouchableOpacity>
        </View>

        {/* Lista */}
        {isLoading && ordenes.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#b91c1c" />
          </View>
        ) : (
          <FlatList
            data={ordenes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={
              <View className="mt-20 items-center px-10">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                  <Feather name="check-circle" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-center font-medium">
                    {tab === 'activos' ? 'No tienes órdenes pendientes.' : 'No hay historial reciente.'}
                </Text>
              </View>
            }
            refreshing={isLoading}
            onRefresh={() => fetchOrdenes(tab, searchText)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}