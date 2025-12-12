import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalleExistencia'>;

export default function ExistenciaDetailScreen({ navigation }: Props) {
  const { currentExistencia, isLoading, clearCurrentExistencia, ajustarStock, consumirStock } = useInventoryStore();

  // Estado para Modal de Ajuste de stock
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [notaAjuste, setNotaAjuste] = useState('');

  // Estado para Modal de Consumo
  const [showConsumoModal, setShowConsumoModal] = useState(false);
  const [cantConsumo, setCantConsumo] = useState('');
  const [notaConsumo, setNotaConsumo] = useState('');

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



  const handleAjusteSubmit = async () => {
    if (!nuevaCantidad || parseInt(nuevaCantidad) < 0) {
      Alert.alert("Error", "Ingresa una cantidad válida (0 o superior).");
      return;
    }
    
    if (!currentExistencia) return;

    // Validación de negocio: No permitir ajuste sin cambio real
    if (parseInt(nuevaCantidad) === currentExistencia.cantidad_actual) {
      Alert.alert("Sin cambios", "La nueva cantidad es igual a la actual.");
      return;
    }

    const success = await ajustarStock({
      id: currentExistencia.id,
      nueva_cantidad: parseInt(nuevaCantidad),
      notas: notaAjuste
    });

    if (success) {
      setShowAjusteModal(false);
      setNuevaCantidad('');
      setNotaAjuste('');
      Alert.alert("Ajuste Realizado", "El inventario ha sido actualizado correctamente.");
    }
  };
  // Cálculo de diferencia visual
  const diff = nuevaCantidad && currentExistencia ? parseInt(nuevaCantidad) - (currentExistencia.cantidad_actual || 0) : 0;
  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400';
  const diffSign = diff > 0 ? '+' : '';



  const handleConsumoSubmit = async () => {
    if (!cantConsumo || parseInt(cantConsumo) <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0.");
      return;
    }
    
    if (!currentExistencia) return;

    // Validación Stock Insuficiente (Frontend check rápido)
    if (parseInt(cantConsumo) > (currentExistencia.cantidad_actual || 0)) {
      Alert.alert("Stock Insuficiente", `Solo tienes ${currentExistencia.cantidad_actual} unidades disponibles.`);
      return;
    }

    const success = await consumirStock({
      id: currentExistencia.id.toString(), // Aseguramos string UUID
      cantidad: parseInt(cantConsumo),
      notas: notaConsumo
    });

    if (success) {
      setShowConsumoModal(false);
      setCantConsumo('');
      setNotaConsumo('');
      Alert.alert("Consumo Registrado", "El stock ha sido descontado.");
    }
  };




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
              {/* BLOQUE DE ACCIÓN PARA LOTES */}
              {!isActivo && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-gray-500 text-xs uppercase font-bold mb-3">Gestión de Stock</Text>
                  
                  <View className="flex-row justify-between">
                    {/* Botón CONSUMIR (Principal) */}
                    <TouchableOpacity 
                        onPress={() => setShowConsumoModal(true)}
                        className="bg-orange-600 py-3 rounded-xl flex-row justify-center items-center flex-1 mr-2 shadow-sm"
                    >
                        <Feather name="minus-circle" size={18} color="white" />
                        <Text className="text-white font-bold ml-2">Consumir</Text>
                    </TouchableOpacity>

                    {/* Botón AJUSTAR (Secundario / Corrección) */}
                    <TouchableOpacity 
                        onPress={() => {
                            setNuevaCantidad(currentExistencia?.cantidad_actual?.toString() || '0');
                            setShowAjusteModal(true);
                        }}
                        className="bg-gray-200 py-3 rounded-xl flex-row justify-center items-center flex-1 ml-2"
                    >
                        <Feather name="sliders" size={18} color="#374151" />
                        <Text className="text-gray-700 font-bold ml-2">Ajustar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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




      {/* --- MODAL DE AJUSTE --- */}
      <Modal animationType="slide" transparent={true} visible={showAjusteModal} onRequestClose={() => setShowAjusteModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Ajustar Inventario</Text>
              <TouchableOpacity onPress={() => setShowAjusteModal(false)} className="p-2 bg-gray-100 rounded-full">
                <Feather name="x" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
              <View>
                <Text className="text-gray-500 text-xs mb-1">Stock Actual</Text>
                <Text className="text-2xl font-bold text-gray-800">{currentExistencia?.cantidad_actual}</Text>
              </View>
              <Feather name="arrow-right" size={24} color="#9ca3af" />
              <View className="items-end">
                <Text className="text-gray-500 text-xs mb-1">Nuevo Stock</Text>
                <TextInput 
                  className="text-3xl font-bold text-bomberil-700 text-right min-w-[80px] border-b border-gray-300 p-0"
                  value={nuevaCantidad}
                  onChangeText={setNuevaCantidad}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Indicador de Diferencia */}
            <View className="items-center mb-6">
                <Text className={`font-bold text-lg ${diffColor}`}>
                    Diferencia: {diffSign}{diff} unidades
                </Text>
                <Text className="text-xs text-gray-400">Esto generará un movimiento de tipo AJUSTE</Text>
            </View>

            <Text className="text-gray-600 font-bold mb-2 text-sm">Motivo del ajuste *</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 h-24 text-gray-800"
              placeholder="Ej: Conteo cíclico, error de digitación anterior..."
              multiline
              textAlignVertical="top"
              value={notaAjuste}
              onChangeText={setNotaAjuste}
            />

            <TouchableOpacity 
              onPress={handleAjusteSubmit}
              className="bg-bomberil-700 py-4 rounded-xl flex-row justify-center items-center shadow-md mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Feather name="save" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Confirmar Ajuste</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>




      {/* --- MODAL DE CONSUMO --- */}
      <Modal animationType="slide" transparent={true} visible={showConsumoModal} onRequestClose={() => setShowConsumoModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Registrar Consumo</Text>
              <TouchableOpacity onPress={() => setShowConsumoModal(false)} className="p-2 bg-gray-100 rounded-full">
                <Feather name="x" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <View className="bg-orange-50 p-4 rounded-xl mb-6 border border-orange-100">
                <Text className="text-orange-800 text-xs font-bold uppercase mb-1">Disponible</Text>
                <Text className="text-3xl font-extrabold text-orange-900">
                    {currentExistencia?.cantidad_actual} <Text className="text-base font-medium">{currentExistencia?.unidad_medida}</Text>
                </Text>
            </View>

            <Text className="text-gray-600 font-bold mb-2 text-sm">Cantidad a usar</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-xl font-bold text-gray-900"
              placeholder="0"
              keyboardType="numeric"
              value={cantConsumo}
              onChangeText={setCantConsumo}
              autoFocus
            />

            <Text className="text-gray-600 font-bold mb-2 text-sm">Motivo / Uso</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 h-20 text-gray-800"
              placeholder="Ej: Ejercicio de academia, Incendio..."
              multiline
              textAlignVertical="top"
              value={notaConsumo}
              onChangeText={setNotaConsumo}
            />

            <TouchableOpacity 
              onPress={handleConsumoSubmit}
              className="bg-orange-600 py-4 rounded-xl flex-row justify-center items-center shadow-md mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Feather name="check" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Confirmar Consumo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>




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