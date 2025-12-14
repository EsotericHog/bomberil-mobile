import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { useInventoryStore } from '@/store/inventoryStore';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type ScannerRouteProp = RouteProp<AppStackParamList, 'ScannerInventario'>;

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScannerRouteProp>(); // Hook para obtener params
  const insets = useSafeAreaInsets();

  const { fetchExistenciaByQR, setScannedCode } = useInventoryStore();

  // Capturamos si hay una pantalla de retorno definida
  const returnScreen = route.params?.returnScreen;

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', marginBottom: 20 }}>Requerimos acceso a la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.textButton}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // --- LÓGICA DE RETORNO (Nuevo Préstamo) ---
    if (returnScreen) {
      // 1. Guardamos el código en el buzón global
      setScannedCode(data);
      // 2. Volvemos atrás (Cierra el scanner y revela la pantalla anterior intacta)
      navigation.goBack();
      return;
    }

    // --- LÓGICA DEFAULT (Ver Detalle) ---
    // Llamada al endpoint
    const success = await fetchExistenciaByQR(data);
    
    if (success) {
      // Reemplazamos la pantalla actual para que al volver regrese al Dashboard
      navigation.replace('DetalleExistencia', { sku: data });
    } else {
      // Si falló la búsqueda, permitimos escanear de nuevo tras 2 segundos
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* UI Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
        </View>
        
        <Text style={styles.hintText}>
          {returnScreen ? 'Escanea para agregar al préstamo' : 'Escaneando código QR...'}
        </Text>
      </View>

      {scanned && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { alignSelf: 'flex-start', marginLeft: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
  button: { backgroundColor: '#b91c1c', padding: 15, borderRadius: 10 },
  textButton: { color: 'white', fontWeight: 'bold' },
  scanFrame: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#b91c1c' },
  hintText: { color: 'white', opacity: 0.8, fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});