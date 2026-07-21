import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

export default function GroupsListScreen() {
  const { data: publicGroups } = useQuery({ queryKey: ['public-groups'], queryFn: async () => (await apiClient.get('/groups/public')).data });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Pressable onPress={() => router.push('/(tabs)/groups/create')}><Text>Crear grupo</Text></Pressable>
      <Text style={{ marginTop: 16, fontWeight: '600' }}>Grupos públicos</Text>
      <FlatList
        data={publicGroups ?? []}
        keyExtractor={(g: any) => g.id}
        renderItem={({ item }: any) => (
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: item.id } })}><Text>{item.name}</Text></Pressable>
        )}
      />
    </View>
  );
}
