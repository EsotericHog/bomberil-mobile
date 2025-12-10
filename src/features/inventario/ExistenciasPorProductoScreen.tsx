import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Existencia } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'ExistenciasPorProducto'>;

export default function ExistenciasPorProductoScreen({ navigation, route }: Props) {
  const { productoId, nombreProducto } = route.params;
  const { existenciasProducto, isLoading, fetchExistenciasPorProducto, clearExistenciasProducto, fetchExistenciaByQR } = useInventoryStore();

  useEffect(() => {
    fetchExistenciasPorProducto(productoId);
    // Limpiar al salir para evitar parpadeos en futuras navegaciones
    return () => clearExistenciasProducto();
  }, [productoId]);

  const handleItemPress = async (codigo: string) => {
    // Esto activará el isLoading global, mostrando el spinner brevemente
    const success = await fetchExistenciaByQR(codigo);
    
    if (success) {
      navigation.navigate('DetalleExistencia', { sku: codigo });
    }
  };


  const renderItem = ({ item }: { item: Existencia }) => {
    // Definir color según estado para un indicador visual rápido
    const isDisponible = item.estado === 'DISPONIBLE';
    const statusColor = isDisponible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

    return (
      <TouchableOpacity 
        className="bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm flex-row items-center"
        onPress={() => handleItemPress(item.codigo)}
      >
        <View className="mr-3 bg-gray-50 p-3 rounded-lg">
           {/* Icono diferenciado si es Activo (Unitario) o Lote (Caja) */}
           <Feather 
             name={item.tipo_existencia === 'ACTIVO' ? 'hash' : 'layers'} 
             size={20} 
             color="#4b5563" 
           />
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between mb-1">
            <Text className="font-bold text-gray-800 text-sm">
              {item.codigo}
            </Text>
            <View className={`px-2 py-0.5 rounded text-xs ${statusColor}`}>
               <Text className="text-[10px] font-bold uppercase">{item.estado}</Text>
            </View>
          </View>
          
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {item.ubicacion}
          </Text>

          {/* Dato extra según tipo: Serie o Vencimiento */}
          <Text className="text-gray-400 text-[10px] mt-1">
            {item.tipo_existencia === 'ACTIVO' 
              ? `Serie: ${item.serie || 'S/N'}` 
              : `Vence: ${item.vencimiento || 'N/A'}`}
          </Text>
        </View>

        <Feather name="chevron-right" size={20} color="#d1d5db" />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 px-4 pt-2">
        
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-gray-200">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="ml-2 flex-1">
            <Text className="text-xs text-gray-500 font-bold uppercase tracking-wider">Producto</Text>
            <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{nombreProducto}</Text>
          </View>
        </View>

        {/* Lista */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#b91c1c" />
          </View>
        ) : (
          <FlatList
            data={existenciasProducto}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="mt-10 items-center px-10">
                <Text className="text-gray-400 text-center">No hay existencias registradas para este producto en tu estación.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}