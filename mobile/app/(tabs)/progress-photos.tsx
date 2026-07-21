import { View, Image, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, Button, EmptyState, spacing, radius } from '../../src/ui';
import { useT } from '../../src/i18n';

type ProgressPhoto = {
  id: string;
  photoUrl: string;
  weightAtTimeKg: string | null;
  takenAt: string;
};

export default function ProgressPhotosScreen() {
  const t = useT();
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
      t('social.photos.confirmTitle'),
      t('social.photos.confirmMessage'),
      [{ text: t('social.photos.confirmCancel'), style: 'cancel' }, { text: t('social.photos.confirmSave'), onPress: () => upload.mutate() }],
    );
  }

  return (
    <Screen
      title={t('social.photos.title')}
      subtitle={t('social.photos.subtitle')}
    >
      <Button
        title={t('social.photos.addButton')}
        variant="success"
        loading={upload.isPending}
        onPress={confirmAndUpload}
        style={{ marginBottom: spacing.xl }}
      />
      <FlatList
        data={photos ?? []}
        keyExtractor={(p: ProgressPhoto) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={
          <EmptyState
            title={t('social.photos.emptyTitle')}
            message={t('social.photos.emptyMessage')}
          />
        }
        renderItem={({ item }: { item: ProgressPhoto }) => (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: item.photoUrl }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: radius.lg,
              }}
            />
          </View>
        )}
      />
    </Screen>
  );
}
