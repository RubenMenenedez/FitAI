import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import { Screen, Field, Chip, Button, AppText, spacing } from '../../../src/ui';
import { useT } from '../../../src/i18n';

export default function CreateGroupScreen() {
  const t = useT();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const create = useMutation({
    mutationFn: () => apiClient.post('/groups', { name, visibility }),
    onSuccess: ({ data }) => router.replace({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: data.id } }),
  });

  return (
    <Screen title={t('social.groups.create.title')} keyboard scroll>
      <Field
        label={t('social.groups.create.nameLabel')}
        placeholder={t('social.groups.create.namePlaceholder')}
        value={name}
        onChangeText={setName}
      />

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        {t('social.groups.create.visibilityLabel')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
        <Chip
          label={t('social.groups.create.private')}
          active={visibility === 'private'}
          onPress={() => setVisibility('private')}
        />
        <Chip
          label={t('social.groups.create.public')}
          active={visibility === 'public'}
          onPress={() => setVisibility('public')}
        />
      </View>

      <Button
        title={t('social.groups.create.createButton')}
        variant="success"
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
    </Screen>
  );
}
