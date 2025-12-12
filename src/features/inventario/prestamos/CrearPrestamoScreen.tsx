import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLoansStore } from '@/store/loansStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { ItemPrestable, ItemPrestamoPayload } from '@/features/inventario/types';
import { useAuthStore } from '@/store/authStore';

type Props = NativeStackScreenProps<AppStackParamList, 'CrearPrestamo'>;

// Interfaz auxiliar para el carrito visual
interface CarritoItem extends ItemPrestable {
  cantidad_seleccionada: number;
}

export default function CrearPrestamoScreen({ navigation, route }: Props) {
  const { 
    destinatarios, itemsPrestables, isLoading, 
    fetchDestinatarios, fetchItemsPrestables, crearPrestamo, clearItemsPrestables,
    fetchItemByCode
  } = useLoansStore();

  // Estado Destinatario
  const [destinatarioId, setDestinatarioId] = useState<number | null>(null);
  const [nuevoDestNombre, setNuevoDestNombre] = useState('');
  const [nuevoDestContacto, setNuevoDestContacto] = useState('');
  const [showDestModal, setShowDestModal] = useState(false);

  // Estado General
  const [notas, setNotas] = useState('');
  // Estado Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const { estacion } = useAuthStore();

  // Estados Smart Search
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [searchType, setSearchType] = useState<'ACT' | 'LOT'>('ACT');
  
  // Estado Modal Búsqueda Ítems
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  // ESCUCHA DE RETORNO DEL ESCÁNER
  useEffect(() => {
    if (route.params?.scannedCode) {
      const code = route.params.scannedCode;
      
      // Limpiamos el parámetro para que no se dispare de nuevo accidentalmente
      navigation.setParams({ scannedCode: undefined });
      
      console.log("Código recibido del escáner:", code);
      processScannedCode(code);
    }
  }, [route.params?.scannedCode]);

  // FUNCIÓN PROCESADORA (Reutiliza tu lógica de búsqueda)
  const processScannedCode = async (code: string) => {
    const item = await fetchItemByCode(code);
    
    if (item) {
      handleAddItem(item);
      // Feedback visual opcional
      // Alert.alert("Agregado", `${item.nombre} agregado al carrito.`);
    } else {
      Alert.alert("No encontrado", `El código escaneado no está disponible: ${code}`);
    }
  };



  useEffect(() => {
    fetchDestinatarios();
  }, []);

  // Buscar ítems al escribir (debounce manual simple)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (showItemModal && searchQuery.length > 2) {
        fetchItemsPrestables(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, showItemModal]);

  // Lógica de Agregar al Carrito (Reutilizada y mejorada)
  const handleAddItem = (item: ItemPrestable) => {
    const existe = carrito.find(c => c.id === item.id);
    if (existe) {
      Alert.alert("Ya agregado", `El ítem ${item.codigo} ya está en la lista.`);
      return;
    }
    
    // Validación stock 0 (Backend no debería devolverlo, pero por seguridad)
    if (item.cantidad_disponible <= 0) {
      Alert.alert("Sin Stock", "Este ítem no tiene unidades disponibles para prestar.");
      return;
    }

    const nuevoItem: CarritoItem = {
      ...item,
      cantidad_seleccionada: 1
    };
    
    setCarrito([...carrito, nuevoItem]);
    
    // Cerrar modales si están abiertos
    setShowItemModal(false);
    setShowSmartModal(false);
    setSmartInput('');
    setSearchQuery('');
    clearItemsPrestables();
  };

  // --- LÓGICA SMART SEARCH & SCANNER ---
  const formatCode = (input: string): string => {
    const raw = input.trim().toUpperCase();
    if (raw.includes('-') && raw.length > 8) return raw; // Ya es código completo

    // Construir código: {COD_ESTACION}-{TIPO}-{NUMERO}
    // Ajusta 'estacion?.codigo' según cómo lo guardes en tu authStore (string)
    const stationCode = estacion?.codigo || `Estacion sin código`;
    const numberPart = raw.padStart(5, '0');
    
    return `${stationCode}-${searchType}-${numberPart}`;
  };

  const handleSmartSearch = async () => {
    if (!smartInput.trim()) return;

    const code = formatCode(smartInput);
    const item = await fetchItemByCode(code);

    if (item) {
      handleAddItem(item);
    } else {
      Alert.alert("No encontrado", `No se encontró disponible el ítem: ${code}`);
    }
  };

  // Mock para el Escáner (En producción, conectarías esto a la respuesta de la cámara)
  const handleScanSimulation = () => {
    Alert.alert("Escáner", "Aquí se abriría la cámara. Al leer un QR, llamaría a fetchItemByCode(qrContent).");
    // Ejemplo: navigation.navigate('ScannerInventario', { onScan: (code) => handleSmartSearch(code) });
  };



  const updateCantidadLote = (id: string, cantidad: string, max: number) => {
    const val = parseInt(cantidad);
    if (isNaN(val)) return;
    
    // Validación: No exceder stock disponible
    const finalVal = val > max ? max : val;

    setCarrito(prev => prev.map(item => 
      item.id === id ? { ...item, cantidad_seleccionada: finalVal } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!destinatarioId && !nuevoDestNombre.trim()) {
      return Alert.alert("Falta Destinatario", "Selecciona uno existente o escribe el nombre de uno nuevo.");
    }
    if (carrito.length === 0) {
      return Alert.alert("Carrito vacío", "Agrega al menos un ítem para prestar.");
    }

    // Construir Payload
    const itemsPayload: ItemPrestamoPayload[] = carrito.map(c => ({
      tipo: c.tipo === 'ACTIVO' ? 'activo' : 'lote', // Backend espera minúsculas
      id: c.id,
      cantidad_prestada: c.cantidad_seleccionada
    }));

    const success = await crearPrestamo({
      destinatario_id: destinatarioId || undefined,
      nuevo_destinatario_nombre: !destinatarioId ? nuevoDestNombre : undefined,
      nuevo_destinatario_contacto: !destinatarioId ? nuevoDestContacto : undefined,
      notas,
      items: itemsPayload
    });

    if (success) {
      Alert.alert("Préstamo Creado", "El registro se guardó correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  // Render Item del Buscador
  const renderSearchItem = ({ item }: { item: ItemPrestable }) => (
    <TouchableOpacity 
      onPress={() => handleAddItem(item)}
      className="p-4 border-b border-gray-100 flex-row justify-between items-center"
    >
      <View className="flex-1">
        <Text className="font-bold text-gray-800">{item.nombre}</Text>
        <Text className="text-xs text-gray-500">
          {item.codigo} • {item.ubicacion}
        </Text>
      </View>
      <View className="items-end">
        <View className={`px-2 py-1 rounded text-xs ${item.tipo === 'ACTIVO' ? 'bg-blue-100' : 'bg-orange-100'}`}>
           <Text className={`text-[10px] font-bold ${item.tipo === 'ACTIVO' ? 'text-blue-800' : 'text-orange-800'}`}>
             {item.tipo}
           </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1">Disp: {item.cantidad_disponible}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header Modal */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-lg font-bold text-gray-800">Nuevo Préstamo</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN 1: DESTINATARIO */}
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Destinatario</Text>
          
          {/* Selector Existente vs Nuevo */}
          <View className="flex-row mb-3">
             <TouchableOpacity 
               onPress={() => setDestinatarioId(null)} 
               className={`mr-3 pb-1 border-b-2 ${destinatarioId === null ? 'border-bomberil-700' : 'border-transparent'}`}
             >
                <Text className={destinatarioId === null ? 'font-bold text-bomberil-700' : 'text-gray-500'}>Nuevo</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setShowDestModal(true)} 
               className={`pb-1 border-b-2 ${destinatarioId !== null ? 'border-bomberil-700' : 'border-transparent'}`}
             >
                <Text className={destinatarioId !== null ? 'font-bold text-bomberil-700' : 'text-gray-500'}>Existente</Text>
             </TouchableOpacity>
          </View>

          {destinatarioId === null ? (
            <>
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-2"
                placeholder="Nombre Entidad / Persona *"
                value={nuevoDestNombre}
                onChangeText={setNuevoDestNombre}
              />
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                placeholder="Teléfono / Contacto (Opcional)"
                value={nuevoDestContacto}
                onChangeText={setNuevoDestContacto}
              />
            </>
          ) : (
             <TouchableOpacity onPress={() => setShowDestModal(true)} className="flex-row justify-between items-center bg-gray-100 p-3 rounded-lg">
                <Text className="font-bold text-gray-800">
                  {destinatarios.find(d => d.id === destinatarioId)?.nombre || 'Seleccionar...'}
                </Text>
                <Feather name="chevron-down" size={20} color="#6b7280" />
             </TouchableOpacity>
          )}
        </View>

        {/* SECCIÓN 2: ÍTEMS */}
        <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Ítems a Prestar ({carrito.length})</Text>
        
        <View className="flex-row justify-between mb-4">
            {/* Botón ESCÁNER */}
            <TouchableOpacity 
                onPress={() => navigation.navigate('ScannerInventario', { returnScreen: 'CrearPrestamo' })} // <--- CAMBIO AQUÍ
                className="flex-1 bg-gray-800 p-4 rounded-xl mr-2 flex-row justify-center items-center shadow-sm"
            >
                <Feather name="camera" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Escanear</Text>
            </TouchableOpacity>

            {/* Botón MANUAL INTELIGENTE */}
            <TouchableOpacity 
                onPress={() => setShowSmartModal(true)}
                className="flex-1 bg-white border border-gray-200 p-4 rounded-xl mr-2 flex-row justify-center items-center shadow-sm"
            >
                <Feather name="hash" size={20} color="#374151" />
                <Text className="text-gray-700 font-bold ml-2">Manual</Text>
            </TouchableOpacity>

            {/* Botón CATÁLOGO (Búsqueda por nombre) */}
            <TouchableOpacity 
                onPress={() => setShowItemModal(true)}
                className="bg-white border border-gray-200 p-4 rounded-xl flex-row justify-center items-center shadow-sm"
            >
                <Feather name="list" size={20} color="#374151" />
            </TouchableOpacity>
        </View>
        
        {/* LISTA CARRITO (Igual que antes) */}
        {carrito.length === 0 ? (
           <View className="border-2 border-dashed border-gray-200 rounded-xl p-8 items-center mb-4 bg-gray-50/50">
             <Feather name="shopping-cart" size={32} color="#d1d5db" />
             <Text className="text-gray-400 text-sm mt-2">Lista vacía</Text>
           </View>
        ) : (
           carrito.map((item) => (
             /* ... (Renderizado de ítem carrito igual que Commit 24) ... */
             <View key={item.id} className="bg-white p-3 mb-2 rounded-xl border border-gray-100 flex-row items-center">
                <View className="mr-3 bg-gray-50 p-2 rounded-lg">
                   <Feather name={item.tipo === 'ACTIVO' ? 'tag' : 'box'} size={20} color="#4b5563" />
                </View>
                <View className="flex-1">
                   <Text className="font-bold text-gray-800 text-sm">{item.nombre}</Text>
                   <Text className="text-xs text-gray-400">{item.codigo}</Text>
                </View>
                <View className="flex-row items-center mx-2">
                  {item.tipo === 'LOTE' ? (
                     <View className="flex-row items-center border border-gray-200 rounded-lg">
                        <TextInput 
                          className="w-10 text-center py-1 font-bold"
                          keyboardType="numeric"
                          value={item.cantidad_seleccionada.toString()}
                          onChangeText={(t) => updateCantidadLote(item.id, t, item.cantidad_disponible)}
                        />
                        <Text className="text-xs text-gray-400 pr-2">/ {item.cantidad_disponible}</Text>
                     </View>
                  ) : (
                     <Text className="font-bold text-gray-500 mr-2">1 un.</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                   <Feather name="trash-2" size={20} color="#ef4444" />
                </TouchableOpacity>
             </View>
           ))
        )}

        <View className="bg-white p-4 rounded-xl shadow-sm mt-2 mb-20">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Notas</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 h-20"
              placeholder="Motivo del préstamo..."
              multiline
              textAlignVertical="top"
              value={notas}
              onChangeText={setNotas}
            />
        </View>

      </ScrollView>

      {/* Footer Botón */}
      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading}
          className={`py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-bomberil-700'}`}
        >
           {isLoading ? (
             <ActivityIndicator color="white" /> 
           ) : (
             <>
               <Feather name="check-circle" size={20} color="white" />
               <Text className="text-white font-bold text-lg ml-2">Confirmar Préstamo</Text>
             </>
           )}
        </TouchableOpacity>
      </View>

      {/* --- MODAL SELECCIÓN DESTINATARIO --- */}
      <Modal visible={showDestModal} animationType="slide">
         <SafeAreaView className="flex-1 bg-white">
            <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
               <TouchableOpacity onPress={() => setShowDestModal(false)} className="p-2 -ml-2">
                  <Feather name="arrow-left" size={24} color="black" />
               </TouchableOpacity>
               <Text className="text-lg font-bold ml-2">Seleccionar Destinatario</Text>
            </View>
            <FlatList 
               data={destinatarios}
               keyExtractor={(item) => item.id.toString()}
               renderItem={({item}) => (
                  <TouchableOpacity 
                    className="p-4 border-b border-gray-100"
                    onPress={() => {
                       setDestinatarioId(item.id);
                       setNuevoDestNombre(''); // Limpiar el otro campo
                       setShowDestModal(false);
                    }}
                  >
                     <Text className="text-base text-gray-800">{item.nombre}</Text>
                  </TouchableOpacity>
               )}
            />
         </SafeAreaView>
      </Modal>

      {/* --- MODAL SMART SEARCH (Manual) --- */}
      <Modal animationType="slide" transparent={true} visible={showSmartModal} onRequestClose={() => setShowSmartModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
          <View className="flex-1 bg-black/50">
            <TouchableOpacity className="flex-1" onPress={() => setShowSmartModal(false)} />
            <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-xl">
              
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Agregar por Código</Text>
                <TouchableOpacity onPress={() => setShowSmartModal(false)} className="p-2 bg-gray-100 rounded-full">
                  <Feather name="x" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {/* Selector Tipo */}
              <View className="flex-row bg-gray-100 p-1 rounded-xl mb-4">
                <TouchableOpacity 
                  onPress={() => setSearchType('ACT')}
                  className={`flex-1 py-2 rounded-lg items-center ${searchType === 'ACT' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${searchType === 'ACT' ? 'text-blue-800' : 'text-gray-400'}`}>Activo (ACT)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setSearchType('LOT')}
                  className={`flex-1 py-2 rounded-lg items-center ${searchType === 'LOT' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${searchType === 'LOT' ? 'text-orange-800' : 'text-gray-400'}`}>Lote (LOT)</Text>
                </TouchableOpacity>
              </View>

              {/* Input Numérico */}
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-6 focus:border-blue-700 focus:bg-white">
                <Text className="text-gray-400 font-bold mr-2 text-lg">
                    {estacion?.codigo || 'E00X'}-{searchType}-
                </Text>
                <TextInput
                  className="flex-1 text-xl font-bold text-gray-900"
                  placeholder="00000"
                  value={smartInput}
                  onChangeText={setSmartInput}
                  keyboardType="numeric"
                  autoFocus={true}
                  maxLength={5}
                />
              </View>

              <TouchableOpacity 
                onPress={handleSmartSearch}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-gray-900'}`}
              >
                {isLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Feather name="plus-circle" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Agregar al Préstamo</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}