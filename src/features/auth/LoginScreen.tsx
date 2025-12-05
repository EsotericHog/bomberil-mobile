import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore'; // <-- Verifica este import

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Traemos la función signIn del store
  const { signIn } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Aquí harías la petición real:
      // const response = await client.post('/auth/login/', { email, password });
      // const { token, permissions } = response.data;

      // 2. DATOS SIMULADOS (Para probar ahora mismo):
      const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAYm9tYmVyYXMuY2wiLCJleHAiOjE5OTk5OTk5OTl9.FIRMA_FALSA";
      const fakePermissions = ['accion_ver_inventario', 'accion_ajustar_stock'];

      // 3. Ejecutamos el login en el store
      // AHORA SÍ FUNCIONA porque la interfaz espera (string, string[])
      await signIn(fakeToken, fakePermissions); 

    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas o fallo de red');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Login Bomberos</Text>
      
      <Text>Usuario</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }}
        autoCapitalize="none"
      />
      
      <Text>Contraseña</Text>
      <TextInput 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#B71C1C" />
      ) : (
        <Button title="Ingresar" onPress={handleLogin} color="#B71C1C" />
      )}
    </View>
  );
}