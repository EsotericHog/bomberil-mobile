import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from "expo-camera"; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import client from '@/api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'QuickScanner'>;

export default function QuickScannerScreen({ navigation }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevención de lecturas múltiples
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);

    console.log(`[QuickScanner] Detectado: ${data} (Tipo: ${type})`);

    try {
      // 1. ANÁLISIS DE PATRÓN

      // CASO A: ¿Es un UUID de Usuario? (Para Ficha Médica)
      // Regex UUID v4 (Case insensitive)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(data)) {
        console.log("[QuickScanner] Detectado UUID -> Redirigiendo a Ficha Médica");
        navigation.replace('FichaMedica', { id: data });
        return;
      }

      // CASO B: ¿Es un Código de Activo?
      // Aceptamos cualquier string que no sea UUID y tenga longitud razonable
      if (data.length > 2) {
        console.log("[QuickScanner] Posible Activo -> Consultando Inventario...");
        await processAsset(data);
        return;
      }

      // CASO C: No reconocido
      throw new Error("Formato no válido");

    } catch (error) {
      console.log("[QuickScanner] Error procesamiento:", error);
      Alert.alert(
        "Código no reconocido", 
        `El formato "${data}" no coincide con activos ni usuarios.`,
        [{ text: "Escanear de nuevo", onPress: () => resetScanner() }]
      );
    }
  };

  const processAsset = async (code: string) => {
    try {
      // Endpoint de búsqueda de inventario
      const response = await client.get(`gestion_inventario/existencias/buscar/?codigo=${code}`);
      const data = response.data;

      // La API puede devolver una lista (búsqueda parcial) o un objeto (búsqueda exacta)
      // Adaptamos la lógica para ser robustos
      let activoId = null;

      if (Array.isArray(data)) {
        if (data.length > 0) activoId = data[0].sku; // O .id según tu modelo
      } else if (data && data.sku) {
        activoId = data.sku; // O .id
      }

      // IMPORTANTE: Tu pantalla DetalleExistencia espera 'sku' como string
      // Si tu backend devuelve el objeto completo, extraemos el identificador correcto.
      // Si 'data' ya es el objeto de la existencia, úsalo.
      
      if (data) {
         // Si la búsqueda fue exitosa, asumimos que el código escaneado ES el SKU o código
         // Navegamos directo pasando el código escaneado
         navigation.replace('DetalleExistencia', { sku: code }); 
      } else {
         throw new Error("No encontrado");
      }

    } catch (error) {
      console.log("[QuickScanner] API Error:", error);
      Alert.alert(
        "No encontrado", 
        `No existe ningún activo con el código: ${code}`, 
        [{ text: "OK", onPress: () => resetScanner() }]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setProcessing(false);
  };

  if (hasPermission === null) return <View className="flex-1 bg-black" />;
  if (hasPermission === false) return <Text className="text-white mt-10 text-center">Sin acceso a cámara</Text>;

  return (
    <View className="flex-1 bg-black">
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        // --- AQUÍ ESTABA EL ERROR: FALTABA ESTA CONFIGURACIÓN ---
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr", 
            "ean13", 
            "ean8", 
            "code128", 
            "code39", 
            "upc_e", 
            "aztec", 
            "pdf417",
            "datamatrix"
          ],
        }}
        style={StyleSheet.absoluteFillObject}
        facing="back"
      />
      
      <SafeAreaView className="flex-1 justify-between p-4">
        {/* Header Overlay */}
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

        {/* Guía Visual */}
        <View className="flex-1 justify-center items-center">
          <View className="w-64 h-64 border-2 border-white/50 rounded-3xl justify-center items-center relative">
            {/* Esquinas */}
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-3xl" />
            
            {processing && <ActivityIndicator size="large" color="#a855f7" />}
          </View>
          <Text className="text-white/80 mt-4 text-center font-medium bg-black/30 px-4 py-1 rounded-full">
            {processing ? "Procesando..." : "Apunta a un Activo o Credencial"}
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center mb-8">
            <Text className="text-gray-400 text-xs text-center px-10">
                El sistema detectará automáticamente si es un equipo o un voluntario.
            </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}