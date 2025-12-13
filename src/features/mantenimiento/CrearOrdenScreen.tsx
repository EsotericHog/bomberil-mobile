import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker'; // Asegúrate de tener esto o usa un input texto simple

type Props = NativeStackScreenProps<AppStackParamList, 'CrearOrden'>;

export default function CrearOrdenScreen({ navigation }: Props) {
  const { crearOrden, isLoading } = useMaintenanceStore();
  
  const [descripcion, setDescripcion] = useState('');
  // Por simplicidad, usaremos fecha de hoy por defecto.
  // Si necesitas selector de fecha complejo, avísame.
  const [usaFecha, setUsaFecha] = useState(false); 
  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      return Alert.alert("Falta información", "Debes describir la falla o motivo de la orden.");
    }

    const payload = {
      descripcion: descripcion,
      fecha_programada: usaFecha ? fecha.toISOString().split('T')[0] : undefined,
      // responsable_id: undefined // Por defecto el backend asigna al usuario actual
    };

    const nuevoId = await crearOrden(payload);
    
    if (nuevoId) {
      // Éxito: Reemplazamos la pantalla actual con el Detalle de la nueva orden
      // para que el usuario pueda agregar activos inmediatamente.
      navigation.replace('DetalleOrden', { id: nuevoId });
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <Text className="text-lg font-bold text-gray-800">Nueva Orden Correctiva</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        
        <View className="bg-white p-5 rounded-xl shadow-sm mb-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-purple-100 p-2 rounded-lg mr-3">
               <Feather name="alert-circle" size={24} color="#7e22ce" />
            </View>
            <View className="flex-1">
               <Text className="font-bold text-gray-800">Reporte de Falla</Text>
               <Text className="text-xs text-gray-500">Describe el problema para generar la orden.</Text>
            </View>
          </View>

          <Text className="label-form mb-2 font-bold text-gray-700">Descripción de la Falla *</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-32 text-gray-800 text-base"
            placeholder="Ej: Fuga de aceite en motor de unidad B-1..."
            multiline
            textAlignVertical="top"
            value={descripcion}
            onChangeText={setDescripcion}
            autoFocus
          />
        </View>

        <View className="bg-white p-5 rounded-xl shadow-sm mb-4">
           <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-gray-700">Programar Fecha Específica</Text>
              <Switch 
                value={usaFecha} 
                onValueChange={setUsaFecha}
                trackColor={{ false: "#d1d5db", true: "#d8b4fe" }}
                thumbColor={usaFecha ? "#7e22ce" : "#f4f3f4"}
              />
           </View>

           {usaFecha && (
             <View>
               <Text className="text-xs text-gray-500 mb-2">Fecha Programada</Text>
               <TouchableOpacity 
                 onPress={() => setShowPicker(true)}
                 className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
               >
                 <Text className="text-gray-800">{fecha.toLocaleDateString()}</Text>
                 <Feather name="calendar" size={20} color="#6b7280" />
               </TouchableOpacity>

               {showPicker && (
                 <DateTimePicker
                   value={fecha}
                   mode="date"
                   display="default"
                   onChange={onDateChange}
                   minimumDate={new Date()}
                 />
               )}
             </View>
           )}
           
           {!usaFecha && (
             <Text className="text-xs text-gray-400 italic">
               Se asignará la fecha de hoy automáticamente.
             </Text>
           )}
        </View>

      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading}
          className={`py-4 rounded-xl flex-row justify-center items-center ${isLoading ? 'bg-gray-400' : 'bg-gray-900'}`}
        >
           {isLoading ? (
             <ActivityIndicator color="white" /> 
           ) : (
             <>
               <Feather name="save" size={20} color="white" />
               <Text className="text-white font-bold text-lg ml-2">Crear Orden</Text>
             </>
           )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}