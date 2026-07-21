import { View, Text, Pressable, FlatList, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

type ProgressPhoto = {
  id: string;
  photoUrl: string;
  weightAtTimeKg: string | null;
  takenAt: string;
};

export default function ProgressPhotosScreen() {
  const queryClient = useQueryClient();
  const { data: photos } = useQuery<ProgressPhoto[]>({
    queryKey: ['progress-photos'],
    queryFn: async () => (await apiClient.get<ProgressPhoto[]>('/progress-photos')).data,
  });

  const upload = useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const { data: urls } = await apiClient.post<{ uploadUrl: string; publicUrl: string }>('/progress-photos/upload-url');
      await new File(asset.uri).upload(urls.uploadUrl, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
      });
      await apiClient.post('/progress-photos', { photoUrl: urls.publicUrl });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });

  function confirmAndUpload() {
    Alert.alert(
      'Guardar foto de progreso',
      'Esta foto se almacenará de forma persistente para que puedas comparar tu progreso en el tiempo. ¿Confirmas?',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Guardar', onPress: () => upload.mutate() }],
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Pressable onPress={confirmAndUpload}><Text>Añadir foto de progreso</Text></Pressable>
      <FlatList
        data={photos ?? []}
        keyExtractor={(p: ProgressPhoto) => p.id}
        numColumns={2}
        renderItem={({ item }: { item: ProgressPhoto }) => (
          <Image source={{ uri: item.photoUrl }} style={{ width: 150, height: 150, margin: 4 }} />
        )}
      />
    </View>
  );
}
