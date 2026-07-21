import { View, Text, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

const EMOJIS = ['🔥', '💪', '👏', '🎉', '❤️'];

export default function GroupFeedScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { data: posts } = useQuery({ queryKey: ['group-posts', groupId], queryFn: async () => (await apiClient.get(`/groups/${groupId}/posts`)).data });

  const react = useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) => apiClient.post(`/groups/posts/${postId}/reactions`, { emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(p: any) => p.id}
        renderItem={({ item }: any) => (
          <View style={{ marginVertical: 12 }}>
            <Text>{item.message}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {EMOJIS.map((emoji) => (
                <Pressable key={emoji} onPress={() => react.mutate({ postId: item.id, emoji })}><Text>{emoji}</Text></Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}
