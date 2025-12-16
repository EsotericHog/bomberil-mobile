import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLoansStore } from '@/store/loansStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { PrestamoDetalleItem, DevolucionItemPayload } from '@/features/inventario/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DetallePrestamo'>;

// Estado local para manejar los inputs de cada fila
type InputState = {
  [detalleId: number]: {
    devolver: string;
    perder: string;
  };
};

export default function DetallePrestamoScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { currentPrestamo, isLoading, fetchDetallePrestamo, gestionarDevolucion, clearCurrentPrestamo } = useLoansStore();
  
  const [inputs, setInputs] = useState<InputState>({});



  useEffect(() => {
    const loadData = async () => {
      const success = await fetchDetallePrestamo(id);
      if (!success) {
        Alert.alert(
          "Error",
          "No se pudo cargar el detalle del préstamo (Sin permisos o no existe).",
          [{ text: "Volver", onPress: () => navigation.goBack() }]
        );
      }
    };

    loadData();
    
    return () => clearCurrentPrestamo();
  }, [id]);

  const handleInputChange = (detalleId: number, field: 'devolver' | 'perder', value: string, max: number) => {
    // Validar numérico
    if (!/^\d*$/.test(value)) return;

    setInputs(prev => {
      const current = prev[detalleId] || { devolver: '', perder: '' };
      const newState = { ...current, [field]: value };
      
      // Validación Cruzada (Devolver + Perder <= Pendiente)
      const valDev = parseInt(newState.devolver || '0');
      const valPer = parseInt(newState.perder || '0');
      
      if (valDev + valPer > max) {
        // Si se pasa, ignoramos el último cambio
        return prev;
      }

      return { ...prev, [detalleId]: newState };
    });
  };

  // Manejador para botones (Activos)
  const toggleActionActivo = (detalleId: number, action: 'devolver' | 'perder') => {
    setInputs(prev => {
      const current = prev[detalleId] || { devolver: '', perder: '' };
      const isCurrentlyActive = current[action] === '1';

      // Si ya estaba activo, lo desactivamos (volver a 0).
      // Si no, activamos la acción actual (1) y limpiamos la otra (0).
      if (isCurrentlyActive) {
        return { ...prev, [detalleId]: { devolver: '', perder: '' } };
      } else {
        return { 
          ...prev, 
          [detalleId]: { 
            devolver: action === 'devolver' ? '1' : '', 
            perder: action === 'perder' ? '1' : '' 
          } 
        };
      }
    });
  };

  const handleSubmit = async () => {
    // Transformar inputs a Payload
    const itemsPayload: DevolucionItemPayload[] = [];
    
    Object.keys(inputs).forEach(key => {
      const detalleId = parseInt(key);
      const data = inputs[detalleId];
      const devolver = parseInt(data.devolver || '0');
      const perder = parseInt(data.perder || '0');

      if (devolver > 0 || perder > 0) {
        itemsPayload.push({ detalle_id: detalleId, devolver, perder });
      }
    });

    if (itemsPayload.length === 0) {
      return Alert.alert("Sin cambios", "Ingresa cantidades a devolver o reportar como perdidas.");
    }

    Alert.alert(
      "Confirmar Gestión",
      `Vas a procesar ${itemsPayload.length} registros. Esta acción actualizará el stock.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            const success = await gestionarDevolucion(id, { items: itemsPayload });
            if (success) {
              setInputs({}); // Limpiar inputs tras éxito
              Alert.alert("Éxito", "La devolución fue procesada.");
            }
          }
        }
      ]
    );
  };

  if (isLoading && !currentPrestamo) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#b91c1c" />
      </View>
    );
  }

  if (!currentPrestamo) return null;

  const isCompletado = currentPrestamo.estado === 'COM';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 ml-2">Gestión Préstamo #{currentPrestamo.id}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          
          {/* CABECERA PRÉSTAMO */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-bomberil-700">
             <Text className="text-xs font-bold text-gray-400 uppercase">Destinatario</Text>
             <Text className="text-xl font-bold text-gray-900 mb-2">{currentPrestamo.destinatario}</Text>
             
             <View className="flex-row justify-between mb-2">
               <Text className="text-gray-500 text-xs">Fecha: {new Date(currentPrestamo.fecha_prestamo).toLocaleDateString()}</Text>
               <View className={`px-2 py-0.5 rounded ${isCompletado ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Text className={`text-[10px] font-bold uppercase ${isCompletado ? 'text-green-800' : 'text-yellow-800'}`}>
                    {currentPrestamo.estado_display}
                  </Text>
               </View>
             </View>
             {currentPrestamo.notas ? <Text className="text-gray-500 text-xs italic">"{currentPrestamo.notas}"</Text> : null}
          </View>

          {/* LISTA DE ÍTEMS */}
          <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Ítems Prestados</Text>
          
          {currentPrestamo.items.map((item) => {
            const inputData = inputs[item.detalle_id] || { devolver: '', perder: '' };
            const isSaldado = item.saldado;
            const isActivo = item.tipo === 'activo'; // Detectar tipo

            // Para botones de activos
            const isReturning = inputData.devolver === '1';
            const isLosing = inputData.perder === '1';

            return (
              <View key={item.detalle_id} className={`bg-white p-4 mb-3 rounded-xl border ${isSaldado ? 'border-green-100 opacity-70' : 'border-gray-200'} shadow-sm`}>
                
                {/* Info Básica (Igual) */}
                <View className="flex-row justify-between items-start mb-3">
                   <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <View className={`mr-2 px-1.5 py-0.5 rounded ${isActivo ? 'bg-blue-100' : 'bg-orange-100'}`}>
                           <Text className={`text-[10px] font-bold ${isActivo ? 'text-blue-800' : 'text-orange-800'}`}>{isActivo ? 'ACT' : 'LOT'}</Text>
                        </View>
                        <Text className="font-bold text-gray-800 flex-1">{item.nombre}</Text>
                      </View>
                      <Text className="text-xs text-gray-500">{item.codigo}</Text>
                   </View>
                   {isSaldado && (
                      <View className="bg-green-50 px-2 py-1 rounded">
                         <Feather name="check" size={14} color="green" />
                      </View>
                   )}
                </View>

                {/* Estadísticas (Igual) */}
                <View className="flex-row bg-gray-50 p-2 rounded-lg justify-between mb-3">
                   <View className="items-center flex-1">
                      <Text className="text-[10px] text-gray-400 uppercase">Prestado</Text>
                      <Text className="font-bold text-gray-700">{item.cantidad_prestada}</Text>
                   </View>
                   <View className="items-center flex-1 border-l border-gray-200">
                      <Text className="text-[10px] text-gray-400 uppercase">Devuelto</Text>
                      <Text className="font-bold text-green-600">{item.cantidad_devuelta}</Text>
                   </View>
                   <View className="items-center flex-1 border-l border-gray-200">
                      <Text className="text-[10px] text-gray-400 uppercase">Pendiente</Text>
                      <Text className="font-bold text-orange-600 text-lg">{item.pendiente}</Text>
                   </View>
                </View>

                {/* ZONA DE GESTIÓN */}
                {!isSaldado && (
                  <View>
                    {isActivo ? (
                      /* OPCIÓN A: BOTONES (Solo para Activos) */
                      <View className="flex-row gap-2 mt-1">
                        <TouchableOpacity 
                          onPress={() => toggleActionActivo(item.detalle_id, 'devolver')}
                          className={`flex-1 py-3 rounded-xl border flex-row justify-center items-center ${isReturning ? 'bg-green-600 border-green-600' : 'bg-white border-green-200'}`}
                        >
                          <Feather name="check-circle" size={18} color={isReturning ? 'white' : '#15803d'} />
                          <Text className={`ml-2 font-bold ${isReturning ? 'text-white' : 'text-green-700'}`}>Devolver</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => toggleActionActivo(item.detalle_id, 'perder')}
                          className={`flex-1 py-3 rounded-xl border flex-row justify-center items-center ${isLosing ? 'bg-red-600 border-red-600' : 'bg-white border-red-200'}`}
                        >
                          <Feather name="alert-circle" size={18} color={isLosing ? 'white' : '#b91c1c'} />
                          <Text className={`ml-2 font-bold ${isLosing ? 'text-white' : 'text-red-700'}`}>Perdido</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* OPCIÓN B: INPUTS (Solo para Lotes) */
                      <View className="flex-row gap-2 mt-1">
                        <View className="flex-1">
                           <Text className="text-[10px] text-green-700 font-bold mb-1 ml-1">DEVOLVER (Cant.)</Text>
                           <TextInput 
                              className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center font-bold text-green-900"
                              placeholder="0"
                              keyboardType="numeric"
                              value={inputData.devolver}
                              onChangeText={(t) => handleInputChange(item.detalle_id, 'devolver', t, item.pendiente)}
                           />
                        </View>
                        <View className="flex-1">
                           <Text className="text-[10px] text-red-700 font-bold mb-1 ml-1">REPORTAR (Cant.)</Text>
                           <TextInput 
                              className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-bold text-red-900"
                              placeholder="0"
                              keyboardType="numeric"
                              value={inputData.perder}
                              onChangeText={(t) => handleInputChange(item.detalle_id, 'perder', t, item.pendiente)}
                           />
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
          
          <View className="h-20" /> 
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer (Solo si no está completado) */}
      {!isCompletado && (
        <View className="p-4 bg-white border-t border-gray-100">
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isLoading}
            className={`py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-gray-900'}`}
          >
             {isLoading ? (
               <ActivityIndicator color="white" /> 
             ) : (
               <>
                 <Feather name="save" size={20} color="white" />
                 <Text className="text-white font-bold text-lg ml-2">Guardar Gestión</Text>
               </>
             )}
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}