import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import { Screen, Field, Chip, Button, AppText, spacing } from '../../../src/ui';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const create = useMutation({
    mutationFn: () => apiClient.post('/groups', { name, visibility }),
    onSuccess: ({ data }) => router.replace({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: data.id } }),
  });

  return (
    <Screen title="Crear grupo" keyboard scroll>
      <Field
        label="Nombre del grupo"
        placeholder="Nombre del grupo"
        value={name}
        onChangeText={setName}
      />

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        Visibilidad
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
        <Chip
          label="Privado"
          active={visibility === 'private'}
          onPress={() => setVisibility('private')}
        />
        <Chip
          label="Público"
          active={visibility === 'public'}
          onPress={() => setVisibility('public')}
        />
      </View>

      <Button
        title="Crear"
        variant="success"
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
    </Screen>
  );
}
