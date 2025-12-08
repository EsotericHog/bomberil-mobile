// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import RecuperarClaveScreen from '@/features/auth/ResetPasswordScreen';

// Importa tus pantallas (crea placeholders vacíos si aún no las tienes)
import LoginScreen from '@/features/auth/LoginScreen'; 
// import RecuperarClaveScreen from '../features/auth/RecuperarClaveScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarClave" component={RecuperarClaveScreen} />
    </Stack.Navigator>
  );
};