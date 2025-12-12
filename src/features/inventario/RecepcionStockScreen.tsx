import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { DetalleRecepcionItem, ProductoStock } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'RecepcionStock'>;

export default function RecepcionStockScreen({ navigation }: Props) {
  const { 
    proveedores, ubicaciones, compartimentos, catalogo, isLoading,
    fetchProveedores, fetchUbicaciones, fetchCompartimentos, fetchCatalogo, recepcionarStock, clearCompartimentos 
  } = useInventoryStore();

  // Estados de Cabecera
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState(''); // Para mostrar en el input
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');

  // Estados de Detalles
  const [detalles, setDetalles] = useState<DetalleRecepcionItem[]>([]);

  // Estados del Modal "Agregar Ítem"
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProd, setSelectedProd] = useState<ProductoStock | null>(null);
  const [selectedUbi, setSelectedUbi] = useState<string | null>(null);
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  
  // Campos del formulario detalle
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [serie, setSerie] = useState('');
  const [lote, setLote] = useState('');
  const [vencimiento, setVencimiento] = useState('');

  // Estados para Modales de Selección (Dropdowns)
  const [showProvSelector, setShowProvSelector] = useState(false);
  const [showProdSelector, setShowProdSelector] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProveedores();
    fetchUbicaciones(true);
    fetchCatalogo();
  }, []);

  useEffect(() => {
    if (selectedUbi) fetchCompartimentos(selectedUbi);
    else clearCompartimentos();
  }, [selectedUbi]);

  // REGLA DE NEGOCIO: Si es Activo, cantidad siempre es 1
  useEffect(() => {
    if (selectedProd?.es_activo) {
      setCantidad('1');
    } else {
      setCantidad('');
    }
  }, [selectedProd]);

  const handleAddItem = () => {
    // Validaciones Obligatorias
    if (!selectedProd) return Alert.alert("Falta Producto", "Debes seleccionar un producto del catálogo.");
    if (!selectedComp) return Alert.alert("Falta Ubicación", "Debes seleccionar una ubicación y compartimento.");
    
    // Validación de Cantidad (Solo para lotes, activos ya está fijo en 1)
    if (!selectedProd.es_activo && (!cantidad || parseInt(cantidad) <= 0)) {
        return Alert.alert("Error", "Ingresa una cantidad válida.");
    }

    const newItem: DetalleRecepcionItem = {
      producto_id: selectedProd.id,
      nombre_producto: selectedProd.nombre,
      compartimento_destino_id: selectedComp,
      cantidad: parseInt(cantidad),
      costo_unitario: costo ? parseInt(costo) : 0, // Opcional, default 0
      
      // Opcionales
      numero_serie: selectedProd.es_activo ? serie : undefined,
      numero_lote: !selectedProd.es_activo ? lote : undefined,
      fecha_vencimiento: !selectedProd.es_activo && vencimiento ? vencimiento : undefined,
    };

    setDetalles([...detalles, newItem]);
    setModalVisible(false);
    resetModalForm();
  };

  const resetModalForm = () => {
    setSelectedProd(null);
    setSelectedUbi(null);
    setSelectedComp(null);
    setCantidad('');
    setCosto('');
    setSerie('');
    setLote('');
    setVencimiento('');
  };

  const handleSubmit = async () => {
    if (!proveedorId) return Alert.alert("Error", "El Proveedor es obligatorio.");
    if (!fecha) return Alert.alert("Error", "La Fecha es obligatoria.");
    if (detalles.length === 0) return Alert.alert("Error", "Agregue al menos un ítem a la recepción.");

    const payload = {
      proveedor_id: proveedorId,
      fecha_recepcion: fecha,
      notas,
      detalles
    };

    const success = await recepcionarStock(payload);
    if (success) {
      Alert.alert("Éxito", "Recepción guardada correctamente.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
  };

  // Renderizado de ítem en lista principal
  const renderDetalleItem = ({ item, index }: { item: DetalleRecepcionItem, index: number }) => (
    <View className="bg-white p-3 mb-2 rounded-xl border border-gray-100 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="font-bold text-gray-800">{item.nombre_producto}</Text>
        <Text className="text-xs text-gray-500">
          Cant: {item.cantidad} • {item.compartimento_destino_id ? 'Ubicación OK' : 'Sin Ubic.'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);
      }}>
        <Feather name="trash-2" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <View className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full">
                <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 ml-2">Nueva Recepción</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* SECCIÓN 1: CABECERA */}
          <View className="bg-white p-4 rounded-2xl shadow-sm mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Cabecera</Text>
            
            {/* Input Fake para Proveedor (Abre Modal) */}
            <Text className="label-form">Proveedor *</Text>
            <TouchableOpacity 
              onPress={() => { setSearchText(''); setShowProvSelector(true); }}
              className="input-select mb-3 flex-row justify-between items-center"
            >
              <Text className={proveedorId ? "text-gray-800" : "text-gray-400"}>
                {proveedorNombre || "Seleccionar Proveedor..."}
              </Text>
              <Feather name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <Text className="label-form">Fecha *</Text>
            <TextInput 
              className="input-form mb-3"
              value={fecha}
              onChangeText={setFecha}
              placeholder="YYYY-MM-DD"
            />

            <Text className="label-form">Notas (Opcional)</Text>
            <TextInput 
              className="input-form h-20"
              value={notas}
              onChangeText={setNotas}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* SECCIÓN 2: DETALLES */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-bold text-gray-400 uppercase">Ítems ({detalles.length})</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} className="flex-row items-center bg-blue-50 px-3 py-1 rounded-full">
              <Feather name="plus" size={16} color="#2563eb" />
              <Text className="text-blue-700 font-bold ml-1 text-xs">Agregar Ítem</Text>
            </TouchableOpacity>
          </View>

          {detalles.length === 0 ? (
            <View className="items-center py-10 border-2 border-dashed border-gray-200 rounded-xl mb-20">
              <Text className="text-gray-400">Carrito vacío</Text>
            </View>
          ) : (
            <View className="mb-24">
                {detalles.map((item, index) => (
                    <View key={index}>{renderDetalleItem({ item, index })}</View>
                ))}
            </View>
          )}
        </ScrollView>

        {/* BOTÓN FINAL */}
        <View className="absolute bottom-4 left-4 right-4">
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isLoading}
            className={`py-4 rounded-xl flex-row justify-center items-center shadow-md ${isLoading ? 'bg-gray-400' : 'bg-bomberil-700'}`}
          >
            {isLoading ? <ActivityIndicator color="white" /> : (
              <>
                <Feather name="check-circle" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Finalizar Recepción</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MODAL AGREGAR ÍTEM --- */}
      <Modal animationType="slide" visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-[90%]">
            
            {/* Header Modal */}
            <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">Detalle del Ítem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              
              {/* 1. Selección de Producto (Dropdown) */}
              <Text className="label-form">Producto *</Text>
              <TouchableOpacity 
                onPress={() => { setSearchText(''); setShowProdSelector(true); }}
                className="input-select mb-4 flex-row justify-between items-center"
              >
                <Text className={selectedProd ? "text-gray-900 font-bold" : "text-gray-400"}>
                  {selectedProd ? selectedProd.nombre : "Buscar en Catálogo..."}
                </Text>
                <Feather name="search" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {selectedProd && (
                <>
                  {/* Fila Cantidad y Costo */}
                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-2">
                        <Text className="label-form">Cantidad {selectedProd.es_activo ? '(Fijo)' : '*'}</Text>
                        <TextInput 
                            className={`input-form ${selectedProd.es_activo ? 'bg-gray-100 text-gray-500' : ''}`}
                            keyboardType="numeric" 
                            value={cantidad} 
                            onChangeText={setCantidad}
                            placeholder="0"
                            editable={!selectedProd.es_activo} // REGLA: Bloqueado si es activo
                        />
                    </View>
                    <View className="flex-1 ml-2">
                        <Text className="label-form">Costo Unit. (Opcional)</Text>
                        <TextInput 
                            className="input-form" 
                            keyboardType="numeric" 
                            value={costo} 
                            onChangeText={setCosto} 
                            placeholder="$"
                        />
                    </View>
                  </View>

                  {/* CAMPOS DINÁMICOS */}
                  {selectedProd.es_activo ? (
                    <View className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <View className="flex-row items-center mb-2">
                        <Feather name="tag" size={16} color="#1d4ed8" />
                        <Text className="text-blue-800 font-bold text-xs ml-2 uppercase">Identificación Activo</Text>
                      </View>
                      <TextInput 
                        className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm" 
                        placeholder="N° de serie del fabricante (Opcional)"
                        value={serie}
                        onChangeText={setSerie}
                      />
                    </View>
                  ) : (
                    <View className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <View className="flex-row items-center mb-2">
                        <Feather name="box" size={16} color="#c2410c" />
                        <Text className="text-orange-800 font-bold text-xs ml-2 uppercase">Datos de Lote</Text>
                      </View>
                      <TextInput 
                        className="bg-white border border-orange-200 rounded-lg px-3 py-2 mb-2 text-sm" 
                        placeholder="N° Lote Fabricante (Opcional)"
                        value={lote}
                        onChangeText={setLote}
                      />
                      <TextInput 
                        className="bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm" 
                        placeholder="Vencimiento YYYY-MM-DD (Opcional)"
                        value={vencimiento}
                        onChangeText={setVencimiento}
                      />
                    </View>
                  )}

                  {/* 2. Ubicación (Mantenemos Scroll Horizontal porque son pocos items) */}
                  <Text className="label-form mt-2">Ubicación Destino *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    {ubicaciones.map(u => (
                      <TouchableOpacity 
                        key={u.id} 
                        onPress={() => { setSelectedUbi(u.id); setSelectedComp(null); }}
                        className={`mr-2 px-4 py-3 rounded-xl border ${selectedUbi === u.id ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={selectedUbi === u.id ? 'text-white font-bold' : 'text-gray-600'}>{u.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Compartimentos (Dependiente) */}
                  {selectedUbi && (
                    <>
                        <Text className="label-form">Compartimento *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        {compartimentos.map(c => (
                            <TouchableOpacity 
                            key={c.id} 
                            onPress={() => setSelectedComp(c.id)}
                            className={`mr-2 px-4 py-3 rounded-xl border ${selectedComp === c.id ? 'bg-bomberil-700 border-bomberil-700' : 'bg-white border-gray-200'}`}
                            >
                            <Text className={selectedComp === c.id ? 'text-white font-bold' : 'text-gray-600'}>{c.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                        </ScrollView>
                    </>
                  )}

                  <TouchableOpacity 
                    onPress={handleAddItem}
                    className="bg-gray-900 py-4 rounded-xl items-center mt-4 mb-10 shadow-sm"
                  >
                    <Text className="text-white font-bold text-base">Agregar al Carrito</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- SELECTOR MODAL GENERIGO (Reutilizable) --- */}
      <SelectionModal 
        visible={showProvSelector}
        onClose={() => setShowProvSelector(false)}
        title="Seleccionar Proveedor"
        data={proveedores}
        onSelect={(item: any) => { setProveedorId(item.id); setProveedorNombre(item.nombre); setShowProvSelector(false); }}
        searchPlaceholder="Buscar proveedor..."
      />

      <SelectionModal 
        visible={showProdSelector}
        onClose={() => setShowProdSelector(false)}
        title="Catálogo de Productos"
        data={catalogo}
        onSelect={(item: any) => { setSelectedProd(item); setShowProdSelector(false); }}
        searchPlaceholder="Buscar producto..."
      />

    </SafeAreaView>
  );
}

// Componente Interno para Modales de Selección
const SelectionModal = ({ visible, onClose, title, data, onSelect, searchPlaceholder }: any) => {
  const [query, setQuery] = useState('');
  
  // Filtro simple local (podría ser remoto si data fuera muy grande, pero catalogo ya se carga)
  const filteredData = data.filter((item: any) => 
    item.nombre.toLowerCase().includes(query.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/60">
        <View className="flex-1 bg-white mt-20 rounded-t-3xl overflow-hidden">
          <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-200 rounded-full">
              <Feather name="x" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View className="p-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Feather name="search" size={20} color="#9ca3af" />
              <TextInput 
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder={searchPlaceholder}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="p-4 border-b border-gray-100 flex-row items-center"
                onPress={() => onSelect(item)}
              >
                <Feather name={item.es_activo ? 'tag' : 'box'} size={18} color="#9ca3af" />
                <View className="ml-3">
                  <Text className="text-gray-800 font-medium text-base">{item.nombre}</Text>
                  {item.sku && <Text className="text-xs text-gray-400">{item.sku}</Text>}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};