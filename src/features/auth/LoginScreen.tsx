import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Alert
} from 'react-native';
import { AxiosError } from 'axios';
import { Feather } from '@expo/vector-icons'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client'; // Importamos el cliente configurado
import { ENDPOINTS } from '@/api/endpoints';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';


type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [rut, setRut] = useState(''); // Cambiado de email a rut
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn } = useAuthStore();

  const handleLogin = async () => {
    if (!rut || !password) {
        Alert.alert('Faltan datos', 'Por favor ingresa tu credencial y contraseña');
        return;
    }
    
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      // 1. PETICIÓN REAL AL BACKEND
      // Enviamos 'username' porque SimpleJWT espera ese campo por defecto (aunque sea un RUT) -> REVISAR
      const response = await client.post(ENDPOINTS.AUTH.LOGIN, {
        rut: rut, // Django espera 'username' aunque le mandes el RUT
        password: password
      });

      const data = response.data;

      // VALIDACIÓN DE SEGURIDAD FRONTEND:
      // Aunque el backend no falle, si por alguna razón devuelve data sin estación,
      // bloqueamos el ingreso aquí mismo.
      if (!data.estacion || !data.permisos || data.permisos.length === 0) {
        Alert.alert(
          'Acceso Denegado', 
          'Tu usuario no tiene una membresía activa en ninguna estación. Contacta a tu oficial a cargo.'
        );
        // No llamamos a signIn(), por lo que no entra al sistema.
        return; 
      }
      
      // 2. INICIAR SESIÓN EN EL STORE
      // data debe coincidir con la interfaz LoginResponse del store
      await signIn(data); 

    } catch (error) {
      const err = error as AxiosError<any>;
      console.log("Error Login RAW:", err.response?.data); // Útil para ver qué llega exactamente

      let mensaje = 'No se pudo conectar con el servidor';
      
      if (err.response?.data) {
        const data = err.response.data;

        // CASO 1: El backend envía 'detail' (común en 403/401)
        if (data.detail) {
          // AQUÍ ESTABA EL ERROR: Verificamos si es Array antes de asignarlo
          mensaje = Array.isArray(data.detail) ? data.detail[0] : String(data.detail);
        } 
        // CASO 2: El backend envía errores de campo (ej: { "rut": ["Este campo es requerido"] })
        else if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                const firstKey = keys[0]; // Ej: "rut"
                const firstError = data[firstKey]; // Ej: ["Error..."]
                const errorTexto = Array.isArray(firstError) ? firstError[0] : String(firstError);
                mensaje = `${firstKey.toUpperCase()}: ${errorTexto}`;
            }
        }
      } else {
        // Fallbacks por código de estado si el body viene vacío
        if (err.response?.status === 401) mensaje = 'Credenciales incorrectas';
        else if (err.response?.status === 403) mensaje = 'Acceso prohibido';
        else if (err.response?.status === 404) mensaje = 'Servidor no encontrado';
        else if (err.response && err.response.status >= 500) mensaje = 'Error interno del servidor';
      }

      // Ahora 'mensaje' es 100% seguro un string
      Alert.alert('Error de Acceso', mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-100">
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center px-6"
          >
            
            {/* --- SECCIÓN LOGO --- */}
            <View className="items-center mb-10">
              <View className="bg-white p-2 rounded-full shadow-lg mb-4">
                <Image 
                  source={require('../../../assets/bomberil_logo.png')}
                  className="w-24 h-24 rounded-full" 
                  resizeMode="contain"
                />
              </View>
              <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Bomberil<Text className="text-bomberil-700">System</Text>
              </Text>
              <Text className="text-gray-500 font-medium mt-1">
                Gestión Integral de Compañía
              </Text>
            </View>

            {/* --- TARJETA DE FORMULARIO --- */}
            <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              
              {/* Input RUT / Credencial */}
              <View className="mb-4 space-y-2">
                <Text className="text-gray-600 font-bold ml-1 text-xs uppercase tracking-wider">
                  Credencial / RUT
                </Text>
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:border-bomberil-700 focus:bg-white transition-colors">
                  <Feather name="user" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 font-medium text-base"
                    placeholder="Ej. 12.345.678-9"
                    placeholderTextColor="#d1d5db"
                    value={rut}
                    onChangeText={setRut} // Actualiza estado rut
                    autoCapitalize="none"
                    // keyboardType="email-address" // Opcional: Quitar si prefieres teclado normal
                  />
                </View>
              </View>

              {/* Input Contraseña */}
              <View className="mb-8 space-y-2">
                <Text className="text-gray-600 font-bold ml-1 text-xs uppercase tracking-wider">
                  Contraseña
                </Text>
                <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <Feather name="lock" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-800 font-medium text-base"
                    placeholder="••••••••"
                    placeholderTextColor="#d1d5db"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="#9ca3af" 
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('RecuperarClave')}
                  className="self-end mt-2">
                  <Text className="text-bomberil-700 font-semibold text-sm">
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Botón de Acción */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`flex-row justify-center items-center py-4 rounded-xl shadow-md ${
                  loading ? 'bg-bomberil-500' : 'bg-bomberil-700'
                }`}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg mr-2">
                      Iniciar Sesión
                    </Text>
                    <Feather name="arrow-right" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

            </View>

            {/* Footer */}
            <View className="mt-8 items-center">
              <Text className="text-gray-400 text-xs">
                Bomberil Mobile v1.0.0
              </Text>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}