import { View, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import { Screen, Card, AppText, Chip, EmptyState, spacing } from '../../../src/ui';
import { useT } from '../../../src/i18n';

const EMOJIS = ['🔥', '💪', '👏', '🎉', '❤️'];

export default function GroupFeedScreen() {
  const t = useT();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { data: posts } = useQuery({ queryKey: ['group-posts', groupId], queryFn: async () => (await apiClient.get(`/groups/${groupId}/posts`)).data });

  const react = useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) => apiClient.post(`/groups/posts/${postId}/reactions`, { emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  return (
    <Screen title={t('social.groups.feed.title')}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(p: any) => p.id}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title={t('social.groups.feed.emptyTitle')}
            message={t('social.groups.feed.emptyMessage')}
          />
        }
        renderItem={({ item }: any) => (
          <Card>
            <AppText variant="body" style={{ marginBottom: spacing.md }}>
              {item.message}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {EMOJIS.map((emoji) => (
                <Chip
                  key={emoji}
                  label={emoji}
                  onPress={() => react.mutate({ postId: item.id, emoji })}
                />
              ))}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
