import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useUsersStore } from '@/store/usersStore';
import { useAuthStore } from '@/store/authStore'; // Importar AuthStore
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'UsuarioDetalle'>;

export default function UsuarioDetalleScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { selectedUsuario, isLoading, fetchUsuarioDetalle, fetchFichaMedica } = useUsersStore();
  const { hasPermission } = useAuthStore(); // Hook de permisos

  // --- PERMISOS ---
  // 1. Permiso para ver la Hoja de Vida Completa
  const canViewHojaVida = hasPermission('accion_gestion_voluntarios_ver_voluntarios');
  
  // 2. Permiso para ver datos médicos sensibles
  const canViewFichaMedica = hasPermission('accion_gestion_medica_ver_fichas_medicas');

  useEffect(() => {
    fetchUsuarioDetalle(id);
  }, [id]);

  const handleVerFicha = async () => {
    if (!canViewFichaMedica) {
      return Alert.alert("Acceso Denegado", "No tienes permisos para ver fichas médicas.");
    }

    // El store maneja el fetch y devuelve false si hay error (ej: 403 Forbidden)
    const success = await fetchFichaMedica(id);
    if (success) {
        navigation.navigate('FichaMedica', { id }); 
    }
  };

  const handleVerHojaVida = async () => {
      if (!canViewHojaVida) {
        return Alert.alert("Acceso Denegado", "No tienes permisos para acceder a la hoja de vida.");
      }

      // Cargamos los datos antes de navegar
      await useUsersStore.getState().fetchHojaVida(id);
      navigation.navigate('HojaVida', { id });
  };

  if (isLoading && !selectedUsuario) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#b91c1c" />
      </View>
    );
  }

  if (!selectedUsuario) return null;

  // Helper para estilos de botones bloqueados
  const getButtonStyle = (enabled: boolean) => 
    `bg-white p-4 rounded-xl shadow-sm mb-3 flex-row items-center justify-between border ${
      enabled ? 'border-gray-100' : 'border-gray-200 opacity-60 bg-gray-50'
    }`;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER GRANDE CON FOTO */}
        <View className="bg-white pb-6 rounded-b-3xl shadow-sm">
            <SafeAreaView>
                <View className="px-4 py-2 flex-row justify-between items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full">
                        <Feather name="arrow-left" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="font-bold text-gray-400 text-xs">PERFIL DE USUARIO</Text>
                    <View style={{width: 40}} />
                </View>

                <View className="items-center mt-4">
                    <View className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white shadow-sm mb-3 overflow-hidden">
                        {selectedUsuario.avatar_url ? (
                            <Image source={{ uri: selectedUsuario.avatar_url }} className="w-full h-full" />
                        ) : (
                            <View className="w-full h-full items-center justify-center bg-gray-300">
                                <Feather name="user" size={40} color="white" />
                            </View>
                        )}
                    </View>
                    <Text className="text-xl font-bold text-gray-900 text-center px-6">
                        {selectedUsuario.nombre_completo}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">{selectedUsuario.roles_display}</Text>
                    
                    <View className={`mt-3 px-3 py-1 rounded-full ${selectedUsuario.estado_codigo === 'AC' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs font-bold ${selectedUsuario.estado_codigo === 'AC' ? 'text-green-800' : 'text-red-800'}`}>
                            {selectedUsuario.estado}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>

        {/* INFO BÁSICA (Visible para quien pueda ver la lista) */}
        <View className="p-4">
            <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Información de Contacto</Text>
                
                <View className="flex-row items-center mb-3">
                    <Feather name="mail" size={18} color="#6b7280" />
                    <Text className="ml-3 text-gray-700">{selectedUsuario.email}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                    <Feather name="phone" size={18} color="#6b7280" />
                    <Text className="ml-3 text-gray-700">{selectedUsuario.telefono}</Text>
                </View>
                <View className="flex-row items-center">
                    <Feather name="map-pin" size={18} color="#6b7280" />
                    <Text className="ml-3 text-gray-700 flex-1">{selectedUsuario.direccion}</Text>
                </View>
            </View>

            {/* BOTONES DE ACCIÓN (PROTEGIDOS) */}
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Documentación</Text>
            
            {/* 1. Botón Hoja de Vida */}
            <TouchableOpacity 
                onPress={handleVerHojaVida}
                disabled={!canViewHojaVida}
                className={getButtonStyle(canViewHojaVida)}
            >
                <View className="flex-row items-center">
                    <View className={`p-2 rounded-lg ${canViewHojaVida ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Feather name="file-text" size={24} color={canViewHojaVida ? "#2563eb" : "#9ca3af"} />
                    </View>
                    <View className="ml-3">
                        <Text className={`font-bold text-base ${canViewHojaVida ? 'text-gray-800' : 'text-gray-400'}`}>
                            Hoja de Vida
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {canViewHojaVida ? "Historial, cargos y premios" : "Acceso restringido"}
                        </Text>
                    </View>
                </View>
                <Feather name={canViewHojaVida ? "chevron-right" : "lock"} size={20} color="#d1d5db" />
            </TouchableOpacity>

            {/* 2. Botón Ficha Médica */}
            <TouchableOpacity 
                onPress={handleVerFicha}
                disabled={!canViewFichaMedica}
                className={getButtonStyle(canViewFichaMedica)}
            >
                <View className="flex-row items-center">
                    <View className={`p-2 rounded-lg ${canViewFichaMedica ? 'bg-red-100' : 'bg-gray-200'}`}>
                        <Feather name="activity" size={24} color={canViewFichaMedica ? "#b91c1c" : "#9ca3af"} />
                    </View>
                    <View className="ml-3">
                        <Text className={`font-bold text-base ${canViewFichaMedica ? 'text-gray-800' : 'text-gray-400'}`}>
                            Ficha Médica
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {canViewFichaMedica ? "Alergias, enfermedades y datos" : "Acceso restringido"}
                        </Text>
                    </View>
                </View>
                <Feather name={canViewFichaMedica ? "chevron-right" : "lock"} size={20} color="#d1d5db" />
            </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}