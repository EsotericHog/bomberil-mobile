import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { injectStore } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

// Inyecta el store en el cliente HTTP para romper el ciclo de dependencias
injectStore(useAuthStore);


export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}