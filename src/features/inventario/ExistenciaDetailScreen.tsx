import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalleExistencia'>;

export default function ExistenciaDetailScreen({ navigation }: Props) {
  const { currentExistencia, isLoading, clearCurrentExistencia } = useInventoryStore();

  useEffect(() => {
    return () => clearCurrentExistencia();
  }, []);

  if (isLoading || !currentExistencia) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#b91c1c" />
      </View>
    );
  }

  // Mapeo seguro del tipo para evitar el error undefined
  const tipoLabel = currentExistencia.tipo_existencia === 'ACTIVO' ? 'ACTIVO SERIALIZADO' : 'LOTE DE INSUMOS';
  const isActivo = currentExistencia.tipo_existencia === 'ACTIVO';

  // Renderizado de cada item del historial
  const renderMovimiento = (mov: any) => (
    <View key={mov.id} className="flex-row py-3 border-b border-gray-100 last:border-0">
      <View className="bg-gray-100 p-2 rounded-lg mr-3">
        <Feather name={mov.tipo === 'SALIDA' ? 'arrow-up-right' : 'arrow-down-left'} size={16} color="#4b5563" />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between">
          <Text className="font-bold text-gray-800 text-sm">{mov.tipo}</Text>
          <Text className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleDateString()}</Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
          {mov.usuario} • {mov.tipo === 'SALIDA' ? `Hacia: ${mov.destino}` : `Desde: ${mov.origen}`}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-2 text-gray-800">Detalle de Existencia</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          
          {/* IMAGEN DEL PRODUCTO (Si existe) */}
          {currentExistencia.imagen && (
            <Image 
              source={{ uri: currentExistencia.imagen }} 
              className="w-full h-64 bg-gray-200"
              resizeMode="contain"
            />
          )}

          <View className="p-5">
            {/* TARJETA PRINCIPAL */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-5 border-l-4 border-bomberil-700">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-bomberil-700 text-xs font-bold uppercase tracking-widest mb-1">
                    {tipoLabel}
                  </Text>
                  <Text className="text-2xl font-extrabold text-gray-900 mb-1 leading-tight">
                    {currentExistencia.nombre}
                  </Text>
                  <Text className="text-gray-500 font-medium text-sm mb-3">
                    {currentExistencia.marca} {isActivo ? currentExistencia.modelo : ''}
                  </Text>
                </View>
                {/* Badge de Estado con color dinámico del backend */}
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: currentExistencia.estado_color === 'green' ? '#dcfce7' : '#fee2e2' }}>
                  <Text style={{ color: currentExistencia.estado_color === 'green' ? '#166534' : '#991b1b' }} className="text-xs font-bold">
                    {currentExistencia.estado}
                  </Text>
                </View>
              </View>

              <View className="flex-row mt-2 pt-4 border-t border-gray-100">
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs uppercase">Código</Text>
                  <Text className="text-gray-800 font-mono font-bold">{currentExistencia.codigo}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs uppercase">Ubicación</Text>
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>{currentExistencia.ubicacion}</Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN: DATOS ESPECÍFICOS */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-5">
              <Text className="text-gray-900 font-bold text-base mb-4">Información Técnica</Text>
              
              {isActivo ? (
                <>
                  <DetailItem icon="hash" label="N° Serie Fabricante" value={currentExistencia.serie || 'S/N'} />
                  {/* Stats de Uso */}
                  {currentExistencia.uso_stats && (
                    <View className="flex-row mt-2 bg-blue-50 p-3 rounded-xl justify-between">
                      <View>
                        <Text className="text-blue-800 text-xs font-bold">Horas de Uso</Text>
                        <Text className="text-2xl font-extrabold text-blue-900">{currentExistencia.uso_stats.total_horas}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-blue-800 text-xs font-bold">Total Registros</Text>
                        <Text className="text-lg font-bold text-blue-900">{currentExistencia.uso_stats.total_registros}</Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <DetailItem icon="box" label="Lote Fabricación" value={currentExistencia.lote_fabricacion || 'N/A'} />
                  <DetailItem icon="calendar" label="Vencimiento" value={currentExistencia.vencimiento || 'No aplica'} />
                  <View className="mt-2 bg-orange-50 p-4 rounded-xl flex-row justify-between items-center">
                    <Text className="text-orange-800 font-bold">Stock Actual</Text>
                    <Text className="text-2xl font-extrabold text-orange-900">
                      {currentExistencia.cantidad_actual} <Text className="text-sm font-normal">{currentExistencia.unidad_medida}</Text>
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* SECCIÓN: HISTORIAL DE MOVIMIENTOS */}
            <View className="bg-white p-5 rounded-2xl shadow-sm mb-10">
              <Text className="text-gray-900 font-bold text-base mb-4">Últimos Movimientos</Text>
              {currentExistencia.historial_movimientos && currentExistencia.historial_movimientos.length > 0 ? (
                currentExistencia.historial_movimientos.map(renderMovimiento)
              ) : (
                <Text className="text-gray-400 text-sm italic">No hay movimientos registrados recientes.</Text>
              )}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Componente Helper simple
const DetailItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <View className="flex-row items-center mb-4 last:mb-0">
    <View className="w-8 items-center">
      <Feather name={icon} size={18} color="#9ca3af" />
    </View>
    <View className="flex-1 ml-2">
      <Text className="text-gray-400 text-xs font-medium">{label}</Text>
      <Text className="text-gray-800 font-semibold text-sm">{value}</Text>
    </View>
  </View>
);