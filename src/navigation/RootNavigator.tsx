// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore'; // Tu store creado anteriormente
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator } from '@/navigation/AppNavigator';
import LockScreen from '@/features/auth/LockScreen';

export const RootNavigator = () => {
  // Consumimos el estado global
  const { isAuthenticated, isAppLocked, isLoading, restoreSession, lockApp, isBiometricEnabled } = useAuthStore();

  useEffect(() => {
    restoreSession(); // Intenta recuperar sesión al abrir la app
  }, []);

  //// BONUS: Bloquear la app si se minimiza (Comportamiento tipo Banco/Authenticator)
  //useEffect(() => {
  //  const subscription = AppState.addEventListener('change', (nextAppState) => {
  //    if (nextAppState === 'background' && isBiometricEnabled && isAuthenticated) {
  //      lockApp(); // <--- Se bloquea al salir
  //    }
  //  });
  //
  //  return () => {
  //    subscription.remove();
  //  };
  //}, [isBiometricEnabled, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* LÓGICA DE 3 ESTADOS */}
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : isAppLocked ? (
        <LockScreen />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
};