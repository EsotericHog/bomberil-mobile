import React from 'react';
import { View, Text, Button } from 'react-native';

export default function InventarioScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text>Módulo de Inventario</Text>
      <Text>Seleccione una acción:</Text>
      
      <Button title="Escanear Código QR" onPress={() => alert('Abriendo cámara...')} />
      
      {/* Botones para Catálogos Globales y Locales [cite: 24, 26] */}
      <Button title="Buscar manual" onPress={() => alert('Buscando...')} />
    </View>
  );
}