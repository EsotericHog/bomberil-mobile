import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
// Importamos el store para usar la acción de búsqueda
import { useInventoryStore } from '@/store/inventoryStore';

type Props = NativeStackScreenProps<AppStackParamList, 'InventarioHome'>;

export default function InventarioScreen({ navigation }: Props) {
  const { fetchExistenciaByQR, isLoading } = useInventoryStore();
  
  // Estados para el Modal de Búsqueda Manual
  const [modalVisible, setModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScanPress = () => {
    navigation.navigate('ScannerInventario'); 
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      Alert.alert("Atención", "Por favor ingresa un código.");
      return;
    }

    // Reutilizamos la misma función del Scanner
    const success = await fetchExistenciaByQR(manualCode);
    
    if (success) {
      setModalVisible(false);
      setManualCode('');
      // Navegamos al detalle, pasando el código ingresado (sku)
      navigation.navigate('DetalleExistencia', { sku: manualCode });
    }
    // Si falla, el store ya maneja el Alert de error, no necesitamos else aquí.
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView className="flex-1 px-6 pt-4">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Inventario</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* ACCIÓN PRINCIPAL: ESCANER */}
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 items-center mb-8">
            <View className="bg-red-50 p-4 rounded-full mb-4">
              <Feather name="maximize" size={40} color="#b91c1c" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center mb-2">
              Escanear Existencia
            </Text>
            <Text className="text-gray-500 text-center text-sm mb-6 px-4">
              Apunta al código QR del activo o lote para ver su hoja de vida y gestionar movimientos.
            </Text>
            
            <TouchableOpacity 
              onPress={handleScanPress}
              className="bg-bomberil-700 w-full py-4 rounded-xl flex-row justify-center items-center shadow-md"
              activeOpacity={0.8}
            >
              <Feather name="camera" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Abrir Escáner</Text>
            </TouchableOpacity>
          </View>

          {/* ACCIONES SECUNDARIAS */}
          <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3 ml-1">
            Otras Operaciones
          </Text>

          <View className="flex-row justify-between mb-4">
            {/* BOTÓN BUSCAR MANUAL CONECTADO */}
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-[48%] items-center"
            >
              <Feather name="search" size={24} color="#4b5563" />
              <Text className="text-gray-700 font-bold mt-2">Buscar Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-[48%] items-center">
              <Feather name="list" size={24} color="#4b5563" />
              <Text className="text-gray-700 font-bold mt-2">Catálogo Local</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL DE BÚSQUEDA MANUAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <View className="flex-1 bg-black/50">
            <TouchableOpacity 
              className="flex-1" 
              onPress={() => setModalVisible(false)} 
            />
            <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-xl">
              
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Búsqueda Manual</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-gray-100 rounded-full">
                  <Feather name="x" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-500 mb-2">Ingresa el Código, SKU o Serie:</Text>
              
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-6 focus:border-bomberil-700 focus:bg-white">
                <Feather name="hash" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-lg font-medium text-gray-900"
                  placeholder="Ej: A-1024 o 789..."
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus={true} // Abre el teclado automáticamente
                />
              </View>

              <TouchableOpacity 
                onPress={handleManualSearch}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-bomberil-500' : 'bg-bomberil-700'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="search" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Buscar Existencia</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}