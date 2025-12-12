import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLoansStore } from '@/store/loansStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { PrestamoResumen } from '@/features/inventario/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<AppStackParamList, 'PrestamosHome'>;

export default function PrestamosHomeScreen({ navigation }: Props) {
  const { prestamos, isLoading, fetchPrestamos } = useLoansStore();
  const [showAll, setShowAll] = useState(false); // false = Solo Activos, true = Todos
  const [searchText, setSearchText] = useState('');

  // Cargar datos al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchPrestamos(showAll, searchText);
    }, [showAll]) // Recargar si cambia el filtro de estado
  );

  // Manejar búsqueda
  const handleSearch = () => {
    fetchPrestamos(showAll, searchText);
  };

  const getStatusColor = (code: string) => {
    switch (code) {
      case 'PEN': return 'bg-yellow-100 text-yellow-800';
      case 'PAR': return 'bg-orange-100 text-orange-800';
      case 'COM': return 'bg-green-100 text-green-800';
      case 'VEN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItem = ({ item }: { item: PrestamoResumen }) => (
    <TouchableOpacity 
      className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm"
      onPress={() => Alert.alert("Próximamente", "El detalle del préstamo se implementará en la Fase 4.")}
      // onPress={() => navigation.navigate('DetallePrestamo', { id: item.id })} // Futuro enlace
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
            {item.destinatario}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(item.fecha).toLocaleDateString()} • Resp: {item.responsable.split(' ')[0]}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-lg ${getStatusColor(item.estado_codigo)}`}>
          <Text className="text-[10px] font-bold uppercase">{item.estado_display}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
        <View className="flex-row items-center">
          <Feather name="layers" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-xs ml-2 font-medium">
            {item.total_items} ítem(s)
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color="#d1d5db" />
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
            <Text className="text-xl font-bold text-gray-800 ml-2">Préstamos</Text>
          </View>
          
          {/* Botón Crear Nuevo */}
          <TouchableOpacity 
            onPress={() => Alert.alert("Próximamente", "La creación de préstamos viene en la Fase 3.")}
            // onPress={() => navigation.navigate('CrearPrestamo')} // Futuro enlace
            className="bg-gray-900 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-bold text-xs ml-1">Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador y Filtros */}
        <View className="flex-row mb-4 space-x-2">
          <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput 
              className="flex-1 ml-2 text-gray-800"
              placeholder="Buscar destinatario..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          
          {/* Toggle Activos/Todos */}
          <TouchableOpacity 
            onPress={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-xl justify-center border ${showAll ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-xs font-bold ${showAll ? 'text-gray-600' : 'text-bomberil-700'}`}>
              {showAll ? 'Todos' : 'Activos'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {isLoading && prestamos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#b91c1c" />
          </View>
        ) : (
          <FlatList
            data={prestamos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }} // Espacio extra abajo
            ListEmptyComponent={
              <View className="mt-20 items-center px-10">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                  <Feather name="clipboard" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-center font-medium">No hay préstamos registrados.</Text>
              </View>
            }
            refreshing={isLoading}
            onRefresh={() => fetchPrestamos(showAll, searchText)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}