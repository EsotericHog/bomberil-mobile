import React from 'react';
import { View, Text, Button } from 'react-native';

export default function PerfilScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text>Mi Nombre: Juan Pérez</Text>
      <Text>Rango: Bombero</Text>
      <Text>Compañía: Segunda Iquique</Text>
      <View style={{ marginTop: 20 }}>
          <Button title="Descargar Hoja de Vida" onPress={() => alert('Descargando PDF...')} />
          <View style={{ height: 10 }} />
          <Button title="Ver Ficha Médica" onPress={() => alert('Mostrando ficha...')} />
      </View>
    </View>
  );
}