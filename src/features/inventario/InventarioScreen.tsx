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
import { useInventoryStore } from '@/store/inventoryStore';
import { useAuthStore } from '@/store/authStore';

type Props = NativeStackScreenProps<AppStackParamList, 'InventarioHome'>;

export default function InventarioScreen({ navigation }: Props) {
  const { fetchExistenciaByQR, isLoading } = useInventoryStore();
  const { estacion, hasPermission } = useAuthStore(); // Obtenemos hasPermission
  
  // --- PERMISOS ---
  // 1. Ver/Buscar Stock (Escanear y Manual)
  const canViewStock = hasPermission('accion_gestion_inventario_ver_stock');
  // 2. Ver Catálogos
  const canViewCatalog = hasPermission('accion_gestion_inventario_ver_catalogos');
  // 3. Recepcionar Stock
  const canReceiveStock = hasPermission('accion_gestion_inventario_recepcionar_stock');
  // 4. Ver Préstamos (Acceso al módulo)
  const canViewLoans = hasPermission('accion_gestion_inventario_ver_prestamos');

  
  // Estados para el Modal de Búsqueda Manual
  const [modalVisible, setModalVisible] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchType, setSearchType] = useState<'ACT' | 'LOT'>('ACT');

  const handleScanPress = () => {
    if (!canViewStock) {
      return Alert.alert("Acceso Denegado", "No tienes permisos para consultar stock.");
    }
    navigation.navigate('ScannerInventario'); 
  };

  const handleOpenManualSearch = () => {
    if (!canViewStock) {
      return Alert.alert("Acceso Denegado", "No tienes permisos para consultar stock.");
    }
    setModalVisible(true);
  };

  // Lógica de "Smart Search"
  const formatCode = (input: string): string => {
    const raw = input.trim().toUpperCase();
    if (raw.includes('-') && raw.length > 8) return raw;
    const stationCode = `${estacion?.codigo.toString().padStart(3, '0')}`;
    const numberPart = raw.padStart(5, '0');
    return `${stationCode}-${searchType}-${numberPart}`;
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) {
      Alert.alert("Atención", "Por favor ingresa un número o código.");
      return;
    }

    const finalCode = formatCode(manualInput);
    const success = await fetchExistenciaByQR(finalCode);
    
    if (success) {
      setModalVisible(false);
      setManualInput('');
      navigation.navigate('DetalleExistencia', { sku: finalCode });
    } else {
        Alert.alert("No encontrado", `No se encontró la existencia con código: ${finalCode}. \n\nVerifica si es un Activo o un Lote.`);
    }
  };

  // Helper para renderizar botones deshabilitados visualmente
  const getButtonStyle = (enabled: boolean, baseStyle: string) => {
    return enabled ? baseStyle : `${baseStyle} opacity-50 bg-gray-100 border-gray-200`;
  };

  const getTextStyle = (enabled: boolean, baseStyle: string) => {
    return enabled ? baseStyle : "text-gray-400 font-bold ml-2";
  };

  const getIconColor = (enabled: boolean, defaultColor: string) => {
    return enabled ? defaultColor : "#9ca3af";
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
          
          {/* ACCIÓN PRINCIPAL: ESCANER (Protegido por canViewStock) */}
          <View className={`rounded-3xl shadow-sm border p-6 items-center mb-8 ${canViewStock ? 'bg-white border-gray-100' : 'bg-gray-100 border-gray-200 opacity-80'}`}>
            <View className={`p-4 rounded-full mb-4 ${canViewStock ? 'bg-red-50' : 'bg-gray-200'}`}>
              <Feather name="maximize" size={40} color={canViewStock ? "#b91c1c" : "#9ca3af"} />
            </View>
            <Text className={`text-lg font-bold text-center mb-2 ${canViewStock ? 'text-gray-900' : 'text-gray-500'}`}>
              Escanear Existencia
            </Text>
            <Text className="text-gray-500 text-center text-sm mb-6 px-4">
              {canViewStock 
                ? "Apunta al código QR del activo o lote para ver su hoja de vida y gestionar movimientos."
                : "No tienes permisos para consultar o escanear existencias."
              }
            </Text>
            
            <TouchableOpacity 
              onPress={handleScanPress}
              disabled={!canViewStock}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-md ${canViewStock ? 'bg-bomberil-700' : 'bg-gray-400'}`}
              activeOpacity={0.8}
            >
              <Feather name={canViewStock ? "camera" : "lock"} size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                {canViewStock ? "Abrir Escáner" : "Acceso Bloqueado"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACCIONES SECUNDARIAS */}
          <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3 ml-1">
            Otras Operaciones
          </Text>

          <View className="flex-row justify-between mb-4">
            {/* BOTÓN BUSCAR MANUAL (Protegido por canViewStock) */}
            <TouchableOpacity 
              onPress={handleOpenManualSearch}
              disabled={!canViewStock}
              className={getButtonStyle(canViewStock, "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-[48%] items-center")}
            >
              <Feather name={canViewStock ? "search" : "lock"} size={24} color={getIconColor(canViewStock, "#4b5563")} />
              <Text className={getTextStyle(canViewStock, "text-gray-700 font-bold mt-2")}>Buscar Manual</Text>
            </TouchableOpacity>

            {/* BOTÓN CATÁLOGO (Protegido por canViewCatalog) */}
            <TouchableOpacity 
              onPress={() => canViewCatalog && navigation.navigate('CatalogoLocal')}
              disabled={!canViewCatalog}
              className={getButtonStyle(canViewCatalog, "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-[48%] items-center")}
            >
              <Feather name={canViewCatalog ? "list" : "lock"} size={24} color={getIconColor(canViewCatalog, "#4b5563")} />
              <Text className={getTextStyle(canViewCatalog, "text-gray-700 font-bold mt-2")}>Catálogo Local</Text>
            </TouchableOpacity>
          </View>

          {/* BOTÓN RECEPCIÓN (Protegido por canReceiveStock) */}
          <TouchableOpacity 
            onPress={() => canReceiveStock && navigation.navigate('RecepcionStock')} 
            disabled={!canReceiveStock}
            className={getButtonStyle(canReceiveStock, "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full items-center mb-4 flex-row justify-center")}
          >
            <Feather name={canReceiveStock ? "download-cloud" : "lock"} size={24} color={getIconColor(canReceiveStock, "#4b5563")} />
            <Text className={getTextStyle(canReceiveStock, "text-gray-700 font-bold ml-2")}>Nueva Recepción de Stock</Text>
          </TouchableOpacity>

          {/* BOTÓN PRÉSTAMOS (Protegido por canViewLoans) */}
          <TouchableOpacity 
            onPress={() => canViewLoans && navigation.navigate('PrestamosHome')} 
            disabled={!canViewLoans}
            className={getButtonStyle(canViewLoans, "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full items-center mt-3 flex-row justify-center")}
          >
            <Feather name={canViewLoans ? "share" : "lock"} size={24} color={getIconColor(canViewLoans, "#4b5563")} />
            <Text className={getTextStyle(canViewLoans, "text-gray-700 font-bold ml-2")}>Gestión de Préstamos</Text>
          </TouchableOpacity>

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
              
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Búsqueda Rápida</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-gray-100 rounded-full">
                  <Feather name="x" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-500 mb-4 text-sm">
                Ingresa el número correlativo (ej: 32) y seleccionaremos el prefijo automáticamente.
              </Text>
              
              <View className="flex-row bg-gray-100 p-1 rounded-xl mb-4">
                <TouchableOpacity 
                  onPress={() => setSearchType('ACT')}
                  className={`flex-1 py-2 rounded-lg items-center ${searchType === 'ACT' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${searchType === 'ACT' ? 'text-bomberil-700' : 'text-gray-400'}`}>Activo (ACT)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setSearchType('LOT')}
                  className={`flex-1 py-2 rounded-lg items-center ${searchType === 'LOT' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`font-bold ${searchType === 'LOT' ? 'text-orange-600' : 'text-gray-400'}`}>Lote (LOT)</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-6 focus:border-bomberil-700 focus:bg-white">
                <Feather name="hash" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-lg font-medium text-gray-900"
                  placeholder="Ej: 32"
                  value={manualInput}
                  onChangeText={setManualInput}
                  keyboardType="numeric"
                  autoFocus={true}
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
                    <Text className="text-white font-bold text-lg ml-2">Buscar</Text>
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