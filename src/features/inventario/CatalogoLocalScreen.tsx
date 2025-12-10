import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { ProductoStock } from './types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<AppStackParamList, 'CatalogoLocal'>;

export default function CatalogoLocalScreen({ navigation }: Props) {
  const { catalogo, isLoading, fetchCatalogo } = useInventoryStore();
  const [searchText, setSearchText] = useState('');

  // Cargar catálogo al entrar
  useFocusEffect(
    useCallback(() => {
      fetchCatalogo();
    }, [])
  );

  // Manejo de búsqueda con delay manual (o al presionar enter/botón)
  const handleSearch = () => {
    fetchCatalogo(searchText);
  };

  const renderItem = ({ item }: { item: ProductoStock }) => (
    <TouchableOpacity 
      className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm flex-row items-center"
      onPress={() => navigation.navigate('ExistenciasPorProducto', { 
        productoId: item.id, 
        nombreProducto: item.nombre 
      })}
    >
      {/* Icono o Imagen */}
      <View className="mr-4">
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} className="w-12 h-12 rounded-lg bg-gray-100" resizeMode="cover" />
        ) : (
          <View className={`w-12 h-12 rounded-lg items-center justify-center ${item.es_activo ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <Feather 
              name={item.es_activo ? 'tag' : 'box'} 
              size={24} 
              color={item.es_activo ? '#2563eb' : '#ea580c'} 
            />
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="font-bold text-gray-900 text-base flex-1 mr-2" numberOfLines={2}>
            {item.nombre}
          </Text>
          {/* Badge Crítico */}
          {item.critico && (
            <View className="bg-red-100 px-2 py-0.5 rounded">
              <Text className="text-red-700 text-[10px] font-bold uppercase">Crítico</Text>
            </View>
          )}
        </View>
        
        <Text className="text-gray-500 text-xs mt-1">{item.marca} • {item.categoria}</Text>
        
        <View className="flex-row items-center mt-2">
          <Text className={`font-extrabold text-lg ${item.critico ? 'text-red-600' : 'text-gray-800'}`}>
            {item.stock_total}
          </Text>
          <Text className="text-gray-400 text-xs ml-1 uppercase">
            {item.es_activo ? 'Unidades' : 'Total'}
          </Text>
        </View>
      </View>

      <Feather name="chevron-right" size={20} color="#e5e7eb" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 px-4 pt-2">
        
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-gray-200">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 ml-2">Mi Inventario</Text>
        </View>

        {/* Buscador Integrado con Backend */}
        <View className="flex-row items-center space-x-2 mb-4">
          <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <Feather name="search" size={20} color="#9ca3af" />
            <TextInput 
              className="flex-1 ml-3 text-gray-800"
              placeholder="Buscar SKU, nombre o marca..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch} // Buscar al dar Enter en teclado
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(''); fetchCatalogo(''); }}>
                <Feather name="x-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            onPress={handleSearch}
            className="bg-bomberil-700 p-3 rounded-xl shadow-sm"
          >
            <Feather name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {isLoading && catalogo.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#b91c1c" />
          </View>
        ) : (
          <FlatList
            data={catalogo}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="mt-20 items-center px-10">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                  <Feather name="inbox" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-center font-medium">No se encontraron productos en tu estación.</Text>
                <Text className="text-gray-400 text-center text-xs mt-2">Intenta ajustar la búsqueda.</Text>
              </View>
            }
            refreshing={isLoading}
            onRefresh={() => fetchCatalogo(searchText)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}