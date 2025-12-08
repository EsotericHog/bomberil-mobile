import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

export default function LockScreen() {
  const { user, unlockApp } = useAuthStore();

  useEffect(() => {
    // Intentar desbloquear automáticamente al abrir
    handleUnlock();
  }, []);

  const handleUnlock = async () => {
    // La función unlockApp del store manejará la lógica de hardware
    await unlockApp();
  };

  return (
    <View className="flex-1 bg-gray-900 justify-center items-center">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <SafeAreaView className="items-center">
        
        <View className="bg-gray-800 p-4 rounded-full mb-6">
          <MaterialIcons name="lock" size={40} color="#f87171" />
        </View>

        <Text className="text-white text-2xl font-bold mb-2">Bomberil System</Text>
        <Text className="text-gray-400 text-sm mb-8">
          Hola, {user?.nombre_completo?.split(' ')[0] || 'Usuario'}
        </Text>

        <TouchableOpacity 
          onPress={handleUnlock}
          className="flex-row items-center bg-bomberil-700 px-8 py-4 rounded-full"
        >
          <MaterialIcons name="fingerprint" size={28} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Desbloquear</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}