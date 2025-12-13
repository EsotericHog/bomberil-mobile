import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Modal, 
    TextInput, 
    FlatList, 
    Image, 
    Switch, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { ItemOrden, ActivoBusquedaOrden } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalleOrden'>;

export default function DetalleOrdenScreen({ navigation, route }: Props) {
  const { id } = route.params;
  
  // Store de Mantenimiento
  const { 
    currentOrden, isLoading, activosBusqueda, 
    fetchDetalleOrden, cambiarEstadoOrden, 
    buscarActivosParaOrden, anadirActivoAOrden, quitarActivoDeOrden,
    registrarTarea, fetchActivoByCodeForOrder,
    clearCurrentOrden, clearBusqueda 
  } = useMaintenanceStore();

  // Store de Auth (para el prefijo de estación)
  const { estacion } = useAuthStore();

  // Estados Locales: Búsqueda Catálogo
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Estados Locales: Búsqueda Inteligente (Manual)
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartInput, setSmartInput] = useState('');

  // Estados Locales: Tareas (Ejecución)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<ItemOrden | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskSuccess, setTaskSuccess] = useState(true);

  // --- EFECTOS ---

  // 1. Carga inicial y limpieza
  useEffect(() => {
    fetchDetalleOrden(id);
    return () => {
      clearCurrentOrden();
      clearBusqueda();
    };
  }, [id]);

  // 2. Escucha del retorno del Escáner
  useEffect(() => {
    if (route.params?.scannedCode) {
      const code = route.params.scannedCode;
      // Limpiamos el parámetro para evitar bucles
      navigation.setParams({ scannedCode: undefined });
      processCode(code);
    }
  }, [route.params?.scannedCode]);

  // 3. Debounce para búsqueda en catálogo
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (showAddModal && searchQuery.length > 2) {
        setSearching(true);
        buscarActivosParaOrden(id, searchQuery).finally(() => setSearching(false));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, showAddModal]);

  // --- LÓGICA DE BÚSQUEDA INTELIGENTE / ESCÁNER ---

  const formatCode = (input: string): string => {
    const raw = input.trim().toUpperCase();
    if (raw.includes('-') && raw.length > 8) return raw; // Ya es código completo

    // Construir: {COD_ESTACION}-ACT-{NUMERO}
    const stationCode = estacion?.codigo || `E${estacion?.id.toString().padStart(3, '0')}`;
    const numberPart = raw.padStart(5, '0');
    return `${stationCode}-ACT-${numberPart}`;
  };

  const processCode = async (code: string) => {
    const finalCode = formatCode(code);
    
    // Usamos la nueva función del store que devuelve el objeto activo sin alterar la lista de búsqueda global
    const activo = await fetchActivoByCodeForOrder(id, finalCode);
    
    if (activo) {
        handleAddActivo(activo);
        setShowSmartModal(false);
        setSmartInput('');
    } else {
        Alert.alert("No disponible", `El activo ${finalCode} no se encontró disponible para esta orden.`);
    }
  };

  // --- HANDLERS FASE 4 (Planificación) ---

  const handleIniciarOrden = () => {
    if (!currentOrden) return;
    if (currentOrden.items.length === 0) {
      return Alert.alert("Orden Vacía", "Debes agregar al menos un activo antes de iniciar.");
    }

    Alert.alert(
      "Iniciar Ejecución",
      "Al iniciar, la orden pasará a 'EN CURSO'. Ya no podrás agregar o quitar activos, solo registrar tareas.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Iniciar", 
          onPress: async () => {
            await cambiarEstadoOrden(id, 'iniciar');
          }
        }
      ]
    );
  };

  const handleAddActivo = async (activo: ActivoBusquedaOrden) => {
    const success = await anadirActivoAOrden(id, activo.id.toString());
    if (success) {
      // Feedback opcional (Toast)
    }
  };

  const handleRemoveActivo = (activo: ItemOrden) => {
    Alert.alert(
      "Quitar Activo",
      `¿Sacar ${activo.codigo} de la orden?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Quitar", 
          style: "destructive",
          onPress: () => quitarActivoDeOrden(id, activo.id)
        }
      ]
    );
  };

  // --- HANDLERS FASE 5 (Ejecución) ---

  const handleFinalizarOrden = () => {
    const pendientes = currentOrden?.items.filter(i => i.estado_trabajo !== 'COMPLETADO').length || 0;
    
    let mensaje = "La orden pasará a estado 'REALIZADA' y se cerrará.";
    if (pendientes > 0) {
      mensaje = `ATENCIÓN: Aún hay ${pendientes} activos sin registro de tarea. ` + mensaje;
    }

    Alert.alert(
      "Finalizar Orden",
      mensaje,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Finalizar", 
          onPress: async () => {
            const success = await cambiarEstadoOrden(id, 'finalizar');
            if (success) {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const handleOpenTaskModal = (activo: ItemOrden) => {
    setSelectedActivo(activo);
    setTaskNotes(''); 
    setTaskSuccess(true);
    setShowTaskModal(true);
  };

  const handleRegisterTask = async () => {
    if (!selectedActivo) return;
    if (!taskNotes.trim()) {
      return Alert.alert("Requerido", "Debes ingresar notas sobre el trabajo realizado.");
    }

    const success = await registrarTarea(id, {
      activo_id: selectedActivo.id,
      notas: taskNotes,
      exitoso: taskSuccess
    });

    if (success) {
      setShowTaskModal(false);
      setSelectedActivo(null);
    }
  };

  // --- RENDERIZADO ---

  if (isLoading && !currentOrden) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    );
  }

  if (!currentOrden) return null;

  const { cabecera, items } = currentOrden;
  const isPendiente = cabecera.estado_codigo === 'PENDIENTE';
  const isEnCurso = cabecera.estado_codigo === 'EN_CURSO';
  const isFinalizada = cabecera.estado_codigo === 'REALIZADA' || cabecera.estado_codigo === 'CANCELADA';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* HEADER NAV */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 ml-2" numberOfLines={1}>
           Orden #{cabecera.id}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        
        {/* TARJETA CABECERA */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-purple-600">
           <View className="flex-row justify-between mb-2">
              <View className="bg-purple-100 px-2 py-1 rounded">
                 <Text className="text-[10px] font-bold text-purple-800 uppercase">{cabecera.tipo}</Text>
              </View>
              <View className={`px-2 py-1 rounded border ${
                 isPendiente ? 'bg-yellow-50 border-yellow-200' : 
                 isEnCurso ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
              }`}>
                 <Text className={`text-[10px] font-bold uppercase ${
                    isPendiente ? 'text-yellow-800' : isEnCurso ? 'text-blue-800' : 'text-green-800'
                 }`}>{cabecera.estado}</Text>
              </View>
           </View>
           
           <Text className="text-xl font-bold text-gray-900 mb-2">{cabecera.titulo}</Text>
           <Text className="text-gray-600 text-sm mb-4">{cabecera.descripcion}</Text>
           
           <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
              <View className="flex-row items-center">
                 <Feather name="calendar" size={14} color="#6b7280" />
                 <Text className="text-xs text-gray-500 ml-1">{cabecera.fecha_programada}</Text>
              </View>
              <View className="flex-row items-center">
                 <Feather name="user" size={14} color="#6b7280" />
                 <Text className="text-xs text-gray-500 ml-1">{cabecera.responsable.split(' ')[0]}</Text>
              </View>
           </View>
        </View>

        {/* LISTA DE ACTIVOS: TÍTULO Y BARRA DE ACCIONES */}
        <Text className="text-xs font-bold text-gray-400 uppercase mb-2">
            Activos Asignados ({items.length})
        </Text>

        {/* Solo mostramos la barra de acciones si está PENDIENTE */}
        {isPendiente && (
            <View className="flex-row justify-between mb-4">
                {/* 1. Botón ESCÁNER */}
                <TouchableOpacity 
                    onPress={() => navigation.navigate('ScannerInventario', { returnScreen: 'DetalleOrden' })}
                    className="flex-1 bg-gray-800 p-3 rounded-xl mr-2 flex-row justify-center items-center shadow-sm"
                >
                    <Feather name="camera" size={18} color="white" />
                    <Text className="text-white font-bold ml-2 text-xs">Escanear</Text>
                </TouchableOpacity>

                {/* 2. Botón MANUAL INTELIGENTE */}
                <TouchableOpacity 
                    onPress={() => setShowSmartModal(true)}
                    className="flex-1 bg-white border border-gray-200 p-3 rounded-xl mr-2 flex-row justify-center items-center shadow-sm"
                >
                    <Feather name="hash" size={18} color="#374151" />
                    <Text className="text-gray-700 font-bold ml-2 text-xs">Manual</Text>
                </TouchableOpacity>

                {/* 3. Botón CATÁLOGO (Lupa) */}
                <TouchableOpacity 
                    onPress={() => setShowAddModal(true)}
                    className="bg-white border border-gray-200 p-3 rounded-xl flex-row justify-center items-center shadow-sm"
                >
                    <Feather name="list" size={18} color="#374151" />
                </TouchableOpacity>
            </View>
        )}

        {/* RENDERIZADO DE ITEMS */}
        {items.length === 0 ? (
           <View className="border-2 border-dashed border-gray-200 rounded-xl p-8 items-center mb-4 bg-gray-50/50">
              <Feather name="tool" size={32} color="#d1d5db" />
              <Text className="text-gray-400 text-sm mt-2 text-center">
                 No hay activos en esta orden.{'\n'}Agrega los equipos a reparar.
              </Text>
           </View>
        ) : (
            items.map((item) => (
                  <TouchableOpacity 
                     key={item.id} 
                     // Si está EN_CURSO y NO completado, permitir click para registrar. Si es PENDIENTE, nada (o borrar).
                     disabled={!(isEnCurso && item.estado_trabajo !== 'COMPLETADO')}
                     onPress={() => handleOpenTaskModal(item)}
                     activeOpacity={0.7}
                     className={`bg-white p-3 mb-2 rounded-xl border flex-row items-center ${
                        item.estado_trabajo === 'COMPLETADO' ? 'border-green-100 opacity-80' : 'border-gray-100'
                     }`}
                  >
                     {/* Imagen / Icono */}
                     <View className="w-10 h-10 bg-gray-50 rounded-lg justify-center items-center mr-3 overflow-hidden">
                        {item.imagen_url ? (
                           <Image source={{ uri: item.imagen_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                           <Feather name="box" size={18} color="#9ca3af" />
                        )}
                     </View>
                     
                     {/* Datos Activo */}
                     <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{item.nombre}</Text>
                        <Text className="text-xs text-gray-500">{item.codigo}</Text>
                        <Text className="text-[10px] text-gray-400" numberOfLines={1}>{item.ubicacion}</Text>
                     </View>

                     {/* Estado / Acciones Individuales */}
                     <View className="ml-2">
                        {isPendiente && (
                            <TouchableOpacity onPress={() => handleRemoveActivo(item)} className="p-2">
                               <Feather name="trash-2" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        )}

                        {isEnCurso && (
                            <View className={`px-3 py-1.5 rounded-full flex-row items-center ${
                               item.estado_trabajo === 'COMPLETADO' ? 'bg-green-100' : 'bg-blue-50 border border-blue-100'
                            }`}>
                               {item.estado_trabajo === 'COMPLETADO' ? (
                                  <>
                                    <Feather name="check" size={14} color="green" />
                                    <Text className="text-[10px] font-bold text-green-800 ml-1">Listo</Text>
                                  </>
                               ) : (
                                  <>
                                    <Feather name="edit-2" size={14} color="#2563eb" />
                                    <Text className="text-[10px] font-bold text-blue-700 ml-1">Registrar</Text>
                                  </>
                               )}
                            </View>
                        )}

                        {isFinalizada && item.estado_trabajo === 'COMPLETADO' && (
                            <Feather name="check-circle" size={20} color="green" />
                        )}
                     </View>
                  </TouchableOpacity>
            ))
        )}

        {/* Espaciador inferior */}
        <View className="h-24" />
      </ScrollView>

      {/* FOOTER ACTIONS: PENDIENTE (INICIAR) */}
      {isPendiente && (
         <View className="p-4 bg-white border-t border-gray-100 absolute bottom-0 left-0 right-0">
            <TouchableOpacity 
               onPress={handleIniciarOrden}
               disabled={isLoading}
               className={`py-4 rounded-xl flex-row justify-center items-center shadow-lg ${isLoading ? 'bg-gray-400' : 'bg-gray-900'}`}
            >
               {isLoading ? <ActivityIndicator color="white" /> : (
                  <>
                     <Feather name="play" size={20} color="white" />
                     <Text className="text-white font-bold text-lg ml-2">Iniciar Orden</Text>
                  </>
               )}
            </TouchableOpacity>
         </View>
      )}

      {/* FOOTER ACTIONS: EN CURSO (FINALIZAR) */}
      {isEnCurso && (
         <View className="p-4 bg-white border-t border-gray-100 absolute bottom-0 left-0 right-0">
            <TouchableOpacity 
               onPress={handleFinalizarOrden}
               disabled={isLoading}
               className={`py-4 rounded-xl flex-row justify-center items-center shadow-lg ${isLoading ? 'bg-gray-400' : 'bg-green-700'}`}
            >
               {isLoading ? <ActivityIndicator color="white" /> : (
                  <>
                     <Feather name="check-square" size={20} color="white" />
                     <Text className="text-white font-bold text-lg ml-2">Finalizar Orden</Text>
                  </>
               )}
            </TouchableOpacity>
         </View>
      )}

      {/* --- MODAL 1: CATÁLOGO DE BÚSQUEDA --- */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
         <View className="flex-1 bg-white">
            <View className="px-4 py-3 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
               <Text className="text-lg font-bold text-gray-800">Añadir Activo</Text>
               <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-2 bg-gray-200 rounded-full">
                  <Feather name="x" size={20} color="#374151" />
               </TouchableOpacity>
            </View>

            <View className="p-4 border-b border-gray-100">
               <View className="flex-row bg-gray-100 rounded-xl px-3 py-2 items-center">
                  <Feather name="search" size={20} color="gray" />
                  <TextInput 
                     className="flex-1 ml-2 text-base"
                     placeholder="Buscar activo disponible..."
                     value={searchQuery}
                     onChangeText={setSearchQuery}
                     autoFocus
                  />
               </View>
               <Text className="text-xs text-gray-400 mt-2 text-center">Busca por nombre o código (min 3 letras)</Text>
            </View>

            {searching ? (
               <ActivityIndicator size="large" className="mt-10" color="#7e22ce" />
            ) : (
               <FlatList 
                  data={activosBusqueda}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                     <TouchableOpacity 
                        onPress={() => handleAddActivo(item)}
                        className="p-4 border-b border-gray-50 flex-row items-center"
                     >
                        <View className="bg-purple-50 p-2 rounded-lg mr-3">
                           <Feather name="box" size={20} color="#7e22ce" />
                        </View>
                        <View className="flex-1">
                           <Text className="font-bold text-gray-800">{item.nombre}</Text>
                           <Text className="text-xs text-gray-500">{item.codigo}</Text>
                           <Text className="text-[10px] text-gray-400">{item.ubicacion}</Text>
                        </View>
                        <Feather name="plus-circle" size={24} color="#7e22ce" />
                     </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                     searchQuery.length > 2 ? (
                        <Text className="text-center text-gray-400 mt-10">No se encontraron activos disponibles.</Text>
                     ) : null
                  }
               />
            )}
         </View>
      </Modal>

      {/* --- MODAL 2: BÚSQUEDA INTELIGENTE (MANUAL) --- */}
      <Modal animationType="slide" transparent={true} visible={showSmartModal} onRequestClose={() => setShowSmartModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
          <View className="flex-1 bg-black/50">
            <TouchableOpacity className="flex-1" onPress={() => setShowSmartModal(false)} />
            <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-xl">
              
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Agregar Activo</Text>
                <TouchableOpacity onPress={() => setShowSmartModal(false)} className="p-2 bg-gray-100 rounded-full">
                  <Feather name="x" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-500 text-xs mb-2">Ingresa el correlativo del activo (Ej: 32)</Text>

              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-6 focus:border-purple-700 focus:bg-white">
                <Text className="text-gray-400 font-bold mr-2 text-lg">
                    {estacion?.codigo || 'E00X'}-ACT-
                </Text>
                <TextInput
                  className="flex-1 text-xl font-bold text-gray-900"
                  placeholder="00000"
                  value={smartInput}
                  onChangeText={setSmartInput}
                  keyboardType="numeric"
                  autoFocus={true}
                  maxLength={5}
                  onSubmitEditing={() => processCode(smartInput)}
                />
              </View>

              <TouchableOpacity 
                onPress={() => processCode(smartInput)}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-purple-700'}`}
              >
                {isLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Feather name="plus-circle" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Agregar a la Orden</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 3: REGISTRO DE TAREA (EJECUCIÓN) --- */}
      <Modal visible={showTaskModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
           <View className="bg-white rounded-t-3xl p-6 pb-10">
              <View className="flex-row justify-between items-center mb-4">
                 <Text className="text-xl font-bold text-gray-800">Registrar Tarea</Text>
                 <TouchableOpacity onPress={() => setShowTaskModal(false)} className="p-2 bg-gray-100 rounded-full">
                    <Feather name="x" size={20} color="#374151" />
                 </TouchableOpacity>
              </View>

              <View className="bg-gray-50 p-3 rounded-xl mb-4 flex-row items-center border border-gray-200">
                 <Feather name="box" size={20} color="#4b5563" />
                 <Text className="font-bold text-gray-700 ml-3 flex-1" numberOfLines={1}>
                    {selectedActivo?.nombre}
                 </Text>
              </View>

              <Text className="label-form mb-2 font-bold text-gray-600">Bitácora / Notas *</Text>
              <TextInput 
                 className="bg-white border border-gray-300 rounded-xl px-4 py-3 h-24 text-gray-800 mb-4"
                 placeholder="Describe el trabajo realizado..."
                 multiline
                 textAlignVertical="top"
                 value={taskNotes}
                 onChangeText={setTaskNotes}
                 autoFocus
              />

              <View className="flex-row justify-between items-center mb-6 bg-gray-50 p-3 rounded-xl">
                 <Text className="font-bold text-gray-700">¿Trabajo Exitoso?</Text>
                 <Switch 
                    value={taskSuccess}
                    onValueChange={setTaskSuccess}
                    trackColor={{ false: "#fca5a5", true: "#86efac" }}
                    thumbColor={taskSuccess ? "#16a34a" : "#dc2626"}
                 />
              </View>

              <TouchableOpacity 
                 onPress={handleRegisterTask}
                 className="bg-gray-900 py-4 rounded-xl flex-row justify-center items-center"
              >
                 <Feather name="save" size={20} color="white" />
                 <Text className="text-white font-bold text-lg ml-2">Guardar Registro</Text>
              </TouchableOpacity>
           </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}