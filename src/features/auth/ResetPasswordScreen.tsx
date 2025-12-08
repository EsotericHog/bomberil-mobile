import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Alert, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types'; // Asegúrate de tener este tipo definido
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

type Props = NativeStackScreenProps<AuthStackParamList, 'RecuperarClave'>;

export default function RecuperarClaveScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Llamada al endpoint que creamos
      await client.post(ENDPOINTS.AUTH.PASSWORD_RESET, { email });
      
      Alert.alert(
        'Correo Enviado',
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).',
        [{ text: 'Volver al Login', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // Por seguridad, aunque falle (ej: correo no existe), a veces es mejor
      // decir que se envió igual para no revelar usuarios. Pero para debug:
      console.log(error);
      Alert.alert('Error', 'No se pudo procesar la solicitud. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-100">
        <StatusBar barStyle="dark-content" />
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6">
            
            {/* Header / Volver */}
            <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-12 left-6 z-10 p-2 bg-white rounded-full shadow-sm">
                <Feather name="arrow-left" size={24} color="#4b5563" />
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View className="bg-white p-4 rounded-full shadow-md mb-4">
                 <Feather name="key" size={40} color="#b91c1c" />
              </View>
              <Text className="text-2xl font-extrabold text-gray-900 text-center">Recuperar Contraseña</Text>
              <Text className="text-gray-500 text-center mt-2 px-4">
                Ingresa tu correo institucional y te enviaremos un enlace para crear una nueva clave.
              </Text>
            </View>

            <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <View className="mb-6 space-y-2">
                <Text className="text-gray-600 font-bold ml-1 text-xs uppercase tracking-wider">Correo Electrónico</Text>
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:border-bomberil-700">
                  <Feather name="mail" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 font-medium text-base"
                    placeholder="ejemplo@bomberos.cl"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSendReset}
                disabled={loading}
                className={`flex-row justify-center items-center py-4 rounded-xl shadow-md ${loading ? 'bg-bomberil-500' : 'bg-bomberil-700'}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Enviar Enlace</Text>
                )}
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}