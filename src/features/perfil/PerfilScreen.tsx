import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'MiPerfil'>;

export default function PerfilScreen({ navigation }: Props) {
  const { 
    user, 
    estacion, 
    signOut, 
    // Variables biométricas
    isBiometricSupported, 
    isBiometricEnabled, 
    checkBiometrics, 
    toggleBiometrics, 
    // Acciones de descarga
    downloadHojaVida,
    downloadFichaMedica
  } = useAuthStore();

  const [isSwitchLoading, setSwitchLoading] = useState(false);

  // Al montar la pantalla, verificamos si el celular soporta huella
  useEffect(() => {
    checkBiometrics();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    setSwitchLoading(true);
    const success = await toggleBiometrics(value);
    if (!success && value) {
      Alert.alert("Error", "No se pudo verificar tu identidad.");
    }
    setSwitchLoading(false);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: signOut }
    ]);
  };

  // Helper para generar iniciales si no hay avatar
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'B';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView className="flex-1">
        
        {/* HEADER CON BOTÓN VOLVER */}
        <View className="px-4 py-2 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-white rounded-full shadow-sm">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 ml-4">Mi Perfil</Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          
          {/* --- TARJETA DE IDENTIDAD --- */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-3xl font-bold text-gray-400">{getInitials(user?.nombre_completo || '')}</Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-bomberil-700 p-2 rounded-full border-2 border-white">
                 <Feather name="shield" size={16} color="white" />
              </View>
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">
              {user?.nombre_completo || 'Sin Nombre'}
            </Text>
            <Text className="text-bomberil-700 font-bold text-sm uppercase tracking-wide mt-1">
              {estacion?.nombre || 'Sin Asignación'}
            </Text>
          </View>

          {/* --- SECCIÓN: INFORMACIÓN PERSONAL --- */}
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Información Personal</Text>
            
            <View className="flex-row items-center mb-4">
              <View className="bg-gray-50 p-3 rounded-xl mr-4">
                <Feather name="hash" size={20} color="#4b5563" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">RUT / Credencial</Text>
                <Text className="text-gray-800 font-bold text-base">{user?.rut}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="bg-gray-50 p-3 rounded-xl mr-4">
                <Feather name="mail" size={20} color="#4b5563" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">Correo Electrónico</Text>
                <Text className="text-gray-800 font-bold text-base" numberOfLines={1} adjustsFontSizeToFit>
                  {user?.email}
                </Text>
              </View>
            </View>
          </View>

          {/* --- SECCIÓN: SEGURIDAD (BIOMETRÍA) --- */}
          {isBiometricSupported && (
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Seguridad</Text>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="bg-indigo-50 p-3 rounded-xl mr-4">
                    <Feather name="smartphone" size={20} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-bold text-base">Ingreso Biométrico</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      Usar huella o rostro para iniciar sesión rápidamente.
                    </Text>
                  </View>
                </View>
                
                <Switch
                  trackColor={{ false: "#d1d5db", true: "#b91c1c" }}
                  thumbColor={isBiometricEnabled ? "#fff" : "#f4f3f4"}
                  onValueChange={handleBiometricToggle}
                  value={isBiometricEnabled}
                  disabled={isSwitchLoading}
                />
              </View>
            </View>
          )}

          {/* --- SECCIÓN: DOCUMENTOS --- */}
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Documentación</Text>
            
            <TouchableOpacity 
              className="flex-row items-center py-3 border-b border-gray-100"
              onPress={downloadHojaVida} // <--- CONECTADO
            >
              <Feather name="file-text" size={20} color="#b91c1c" />
              <Text className="text-gray-700 font-medium ml-3 flex-1">Descargar Hoja de Vida</Text>
              <Feather name="download" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center py-3 pt-4"
              onPress={downloadFichaMedica} // <--- CONECTADO
            >
              <Feather name="activity" size={20} color="#b91c1c" />
              <Text className="text-gray-700 font-medium ml-3 flex-1">Descargar Ficha Médica</Text>
              <Feather name="download" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* BOTÓN CERRAR SESIÓN */}
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row justify-center items-center bg-gray-200 py-4 rounded-xl mb-10"
          >
            <Feather name="log-out" size={20} color="#374151" />
            <Text className="text-gray-700 font-bold ml-2">Cerrar Sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}