import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from "expo-camera";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'QuickScanner'>;

export default function QuickScannerScreen({ navigation }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // 1. DETECCIÓN: ¿Es un Usuario (Ficha Médica)?
    // Patrón: UUID v4 (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(data)) {
      // Es un usuario -> Ir a Ficha Médica
      // 'replace' para que al volver no regrese a la cámara abierta
      navigation.replace('FichaMedica', { id: data });
      return;
    }

    // 2. DETECCIÓN: ¿Es un Activo?
    // Asumimos que es activo si NO es UUID.
    // Tu pantalla DetalleExistencia espera un 'sku' (o código).
    // Si tu código es algo como "E01-ACT-001" o simplemente un ID numérico, lo pasamos directo.
    if (data.length > 0) {
       navigation.replace('DetalleExistencia', { sku: data });
       return;
    }

    // 3. Fallback
    Alert.alert("Error", "Código no reconocido", [
      { text: "OK", onPress: () => setScanned(false) }
    ]);
  };

  if (hasPermission === null) return <View className="flex-1 bg-black" />;
  if (hasPermission === false) return <Text className="text-white text-center mt-10">Sin acceso a la cámara</Text>;

  return (
    <View className="flex-1 bg-black">
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        facing="back"
      />
      
      <SafeAreaView className="flex-1 justify-between p-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="p-3 bg-black/40 rounded-full"
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <View className="bg-black/40 px-4 py-2 rounded-full">
            <Text className="text-white font-bold text-xs">ESCÁNER GLOBAL</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        {/* Marco de enfoque visual */}
        <View className="flex-1 justify-center items-center">
          <View className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
            {/* Esquinas decorativas */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-3xl" />
          </View>
          <Text className="text-white/80 mt-4 font-medium bg-black/30 px-3 py-1 rounded">
            Escanea un Activo o una Credencial
          </Text>
        </View>

        {/* Espaciador inferior */}
        <View className="h-10" />
      </SafeAreaView>
    </View>
  );
}