import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useInventoryStore } from '@/store/inventoryStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { DetalleRecepcionItem, ProductoStock, Ubicacion, Compartimento, Proveedor } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'RecepcionStock'>;

export default function RecepcionStockScreen({ navigation }: Props) {
  const { 
    proveedores, ubicaciones, compartimentos, catalogo, isLoading,
    fetchProveedores, fetchUbicaciones, fetchCompartimentos, fetchCatalogo, recepcionarStock, clearCompartimentos 
  } = useInventoryStore();

  // Estado de Cabecera
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [notas, setNotas] = useState('');

  // Estado de Detalles (Carrito)
  const [detalles, setDetalles] = useState<DetalleRecepcionItem[]>([]);

  // Estados del Modal "Agregar Item"
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProd, setSelectedProd] = useState<ProductoStock | null>(null);
  const [selectedUbi, setSelectedUbi] = useState<string | null>(null);
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  
  // Campos específicos
  const [serie, setSerie] = useState('');
  const [lote, setLote] = useState('');
  const [vencimiento, setVencimiento] = useState('');

  // Carga inicial de datos maestros
  useEffect(() => {
    fetchProveedores();
    fetchUbicaciones(true); // Solo físicas
    fetchCatalogo(); // Para el selector de productos
  }, []);

  // Efecto Cascada: Cargar compartimentos al elegir ubicación
  useEffect(() => {
    if (selectedUbi) {
      fetchCompartimentos(selectedUbi);
    } else {
      clearCompartimentos();
    }
  }, [selectedUbi]);

  const handleAddItem = () => {
    if (!selectedProd || !selectedComp || !cantidad || !costo) {
      Alert.alert("Faltan datos", "Producto, ubicación, cantidad y costo son obligatorios.");
      return;
    }

    const newItem: DetalleRecepcionItem = {
      producto_id: selectedProd.id,
      nombre_producto: selectedProd.nombre, // Para mostrar en la lista
      compartimento_destino_id: selectedComp,
      cantidad: parseInt(cantidad),
      costo_unitario: parseInt(costo),
      // Campos opcionales
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
    if (!proveedorId) return Alert.alert("Error", "Seleccione un proveedor.");
    if (detalles.length === 0) return Alert.alert("Error", "Agregue al menos un ítem.");

    const payload = {
      proveedor_id: proveedorId,
      fecha_recepcion: fecha,
      notas,
      detalles
    };

    const success = await recepcionarStock(payload);
    if (success) {
      Alert.alert("Éxito", "Recepción guardada correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  const renderDetalleItem = ({ item, index }: { item: DetalleRecepcionItem, index: number }) => (
    <View className="bg-white p-3 mb-2 rounded-xl border border-gray-100 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="font-bold text-gray-800">{item.nombre_producto}</Text>
        <Text className="text-xs text-gray-500">Cant: {item.cantidad} • ${item.costo_unitario}</Text>
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
        {/* Header simple */}
        <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full">
                <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 ml-2">Nueva Recepción</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* SECCIÓN 1: CABECERA */}
          <View className="bg-white p-4 rounded-2xl shadow-sm mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Datos Generales</Text>
            
            {/* Selector de Proveedor (Simplificado) */}
            <Text className="text-xs text-gray-500 mb-1">Proveedor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {proveedores.map(p => (
                <TouchableOpacity 
                  key={p.id}
                  onPress={() => setProveedorId(p.id)}
                  className={`mr-2 px-4 py-2 rounded-full border ${proveedorId === p.id ? 'bg-bomberil-700 border-bomberil-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={proveedorId === p.id ? 'text-white font-bold' : 'text-gray-600'}>{p.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-xs text-gray-500 mb-1">Fecha Recepción (YYYY-MM-DD)</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-gray-800"
              value={fecha}
              onChangeText={setFecha}
              placeholder="2023-10-25"
            />

            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 h-20"
              value={notas}
              onChangeText={setNotas}
              placeholder="Notas o comentarios..."
              multiline
            />
          </View>

          {/* SECCIÓN 2: DETALLES */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-bold text-gray-400 uppercase">Ítems a Recepcionar</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} className="flex-row items-center">
              <Feather name="plus-circle" size={18} color="#b91c1c" />
              <Text className="text-bomberil-700 font-bold ml-1">Agregar</Text>
            </TouchableOpacity>
          </View>

          {detalles.length === 0 ? (
            <View className="items-center py-8 border-2 border-dashed border-gray-200 rounded-xl mb-20">
              <Text className="text-gray-400">No hay ítems agregados</Text>
            </View>
          ) : (
            <View className="mb-20">
                {detalles.map((item, index) => (
                    <View key={index}>
                        {renderDetalleItem({ item, index })}
                    </View>
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
                <Feather name="save" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Confirmar Recepción</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MODAL AGREGAR ÍTEM --- */}
      <Modal animationType="slide" visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Agregar Ítem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* 1. Selección de Producto */}
              <Text className="label-form">Producto</Text>
              <ScrollView horizontal className="mb-4">
                {catalogo.map(prod => (
                  <TouchableOpacity 
                    key={prod.id} 
                    onPress={() => setSelectedProd(prod)}
                    className={`mr-2 p-3 rounded-xl border ${selectedProd?.id === prod.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <Text className={`font-bold ${selectedProd?.id === prod.id ? 'text-blue-700' : 'text-gray-600'}`}>{prod.nombre}</Text>
                    <Text className="text-[10px] text-gray-400">{prod.sku}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedProd && (
                <>
                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-2">
                        <Text className="label-form">Cantidad</Text>
                        <TextInput 
                            className="input-form" 
                            keyboardType="numeric" 
                            value={cantidad} 
                            onChangeText={setCantidad}
                            placeholder="0"
                        />
                    </View>
                    <View className="flex-1 ml-2">
                        <Text className="label-form">Costo Unit.</Text>
                        <TextInput 
                            className="input-form" 
                            keyboardType="numeric" 
                            value={costo} 
                            onChangeText={setCosto} 
                            placeholder="$"
                        />
                    </View>
                  </View>

                  {/* CAMPOS DINÁMICOS POR TIPO */}
                  {selectedProd.es_activo ? (
                    <View className="mb-4 bg-blue-50 p-3 rounded-xl">
                      <Text className="text-blue-800 font-bold mb-2 text-xs">DATOS DE ACTIVO</Text>
                      <TextInput 
                        className="bg-white border border-blue-200 rounded-lg px-3 py-2 mb-2" 
                        placeholder="N° de serie del fabricante (opcional)"
                        value={serie}
                        onChangeText={setSerie}
                      />
                    </View>
                  ) : (
                    <View className="mb-4 bg-orange-50 p-3 rounded-xl">
                      <Text className="text-orange-800 font-bold mb-2 text-xs">DATOS DE LOTE</Text>
                      <TextInput 
                        className="bg-white border border-orange-200 rounded-lg px-3 py-2 mb-2" 
                        placeholder="N° Lote Fabricante"
                        value={lote}
                        onChangeText={setLote}
                      />
                      <TextInput 
                        className="bg-white border border-orange-200 rounded-lg px-3 py-2" 
                        placeholder="Vencimiento (YYYY-MM-DD)"
                        value={vencimiento}
                        onChangeText={setVencimiento}
                      />
                    </View>
                  )}

                  {/* 2. Ubicación (Cascada) */}
                  <Text className="label-form mt-2">Ubicación Destino</Text>
                  <ScrollView horizontal className="mb-3">
                    {ubicaciones.map(u => (
                      <TouchableOpacity 
                        key={u.id} 
                        onPress={() => { setSelectedUbi(u.id); setSelectedComp(null); }}
                        className={`mr-2 px-3 py-2 rounded-lg border ${selectedUbi === u.id ? 'bg-gray-800 border-gray-800' : 'border-gray-300'}`}
                      >
                        <Text className={selectedUbi === u.id ? 'text-white' : 'text-gray-600'}>{u.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedUbi && (
                    <>
                        <Text className="label-form">Compartimento</Text>
                        <ScrollView horizontal className="mb-6">
                        {compartimentos.map(c => (
                            <TouchableOpacity 
                            key={c.id} 
                            onPress={() => setSelectedComp(c.id)}
                            className={`mr-2 px-3 py-2 rounded-lg border ${selectedComp === c.id ? 'bg-bomberil-700 border-bomberil-700' : 'border-gray-300'}`}
                            >
                            <Text className={selectedComp === c.id ? 'text-white' : 'text-gray-600'}>{c.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                        </ScrollView>
                    </>
                  )}

                  <TouchableOpacity 
                    onPress={handleAddItem}
                    className="bg-gray-900 py-3 rounded-xl items-center mt-4"
                  >
                    <Text className="text-white font-bold">Agregar a la Lista</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}