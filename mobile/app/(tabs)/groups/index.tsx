import { View, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import { Screen, Card, AppText, Button, EmptyState, spacing } from '../../../src/ui';

export default function GroupsListScreen() {
  const { data: publicGroups } = useQuery({ queryKey: ['public-groups'], queryFn: async () => (await apiClient.get('/groups/public')).data });

  return (
    <Screen
      title="Grupos"
      headerRight={
        <Button
          title="Crear"
          size="md"
          variant="success"
          fullWidth={false}
          onPress={() => router.push('/(tabs)/groups/create')}
        />
      }
    >
      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.md }}>
        Grupos públicos
      </AppText>
      <FlatList
        data={publicGroups ?? []}
        keyExtractor={(g: any) => g.id}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title="Sin grupos públicos"
            message="Crea el primero o espera a que otros usuarios compartan el suyo."
          />
        }
        renderItem={({ item }: any) => (
          <Card
            onPress={() => router.push({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: item.id } })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="h3" weight="bold">
                {item.name}
              </AppText>
              <AppText variant="body" tone="faint">
                {'›'}
              </AppText>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
