import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDocumentStore } from '@/store/documentStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Documento } from './types';

type Props = NativeStackScreenProps<AppStackParamList, 'DocumentalList'>;

export default function DocumentalListScreen({ navigation }: Props) {
  const { documentos, isLoading, fetchDocumentos } = useDocumentStore();
  const [searchText, setSearchText] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchDocumentos(searchText);
    }, [])
  );

  const handleSearch = () => {
    fetchDocumentos(searchText);
  };

  const handleDownload = async (url: string | null) => {
    if (!url) {
      Alert.alert("Error", "El documento no tiene un archivo digital asociado.");
      return;
    }
    // Abrir en el navegador del sistema para descargar/visualizar
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "No se puede abrir este enlace.");
    }
  };

  const renderItem = ({ item }: { item: Documento }) => (
    <View className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm flex-row">
      {/* PREVIEW / ICONO */}
      <View className="w-16 h-20 bg-gray-100 rounded-lg mr-4 overflow-hidden items-center justify-center border border-gray-200">
        {item.preview_url ? (
          <Image 
            source={{ uri: item.preview_url }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
        ) : (
          <Feather name="file-text" size={24} color="#9ca3af" />
        )}
      </View>

      {/* INFO */}
      <View className="flex-1 justify-between">
        <View>
          <View className="flex-row justify-between items-start">
             <Text className="font-bold text-gray-800 text-sm flex-1 mr-2" numberOfLines={2}>
               {item.titulo}
             </Text>
             {item.es_confidencial && (
               <View className="bg-red-100 px-1.5 py-0.5 rounded">
                 <Feather name="lock" size={10} color="#b91c1c" />
               </View>
             )}
          </View>
          
          <Text className="text-xs text-gray-500 mt-1">
             {item.tipo} • {item.fecha}
          </Text>
          <Text className="text-[10px] text-gray-400 mt-0.5" numberOfLines={1}>
             Ubicación: {item.ubicacion_fisica}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
            <Text className="text-[10px] text-gray-400 font-bold">{item.peso_mb}</Text>
            
            <TouchableOpacity 
              onPress={() => handleDownload(item.archivo_url)}
              className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200"
            >
               <Feather name="download-cloud" size={14} color="#374151" />
               <Text className="text-gray-700 text-xs font-bold ml-1">Descargar</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 px-4 pt-2">
        
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full">
             <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 ml-2">Biblioteca Digital</Text>
        </View>

        {/* Buscador */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2 mb-4 shadow-sm">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput 
              className="flex-1 ml-2 text-gray-800"
              placeholder="Buscar actas, manuales..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchText(''); fetchDocumentos(''); }}>
                    <Feather name="x" size={18} color="#9ca3af" />
                </TouchableOpacity>
            )}
        </View>

        {/* Lista */}
        {isLoading && documentos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#d97706" />
          </View>
        ) : (
          <FlatList
            data={documentos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="mt-20 items-center px-10">
                <View className="bg-gray-100 p-4 rounded-full mb-4">
                  <Feather name="folder" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-500 text-center font-medium">No se encontraron documentos.</Text>
              </View>
            }
            refreshing={isLoading}
            onRefresh={() => fetchDocumentos(searchText)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}