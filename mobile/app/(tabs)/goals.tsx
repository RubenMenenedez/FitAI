import { FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, Card, AppText, EmptyState, spacing } from '../../src/ui';

export default function GoalsScreen() {
  const { data: goals } = useQuery({ queryKey: ['goals'], queryFn: async () => (await apiClient.get('/goals')).data });

  return (
    <Screen title="Tus objetivos">
      <FlatList
        data={goals ?? []}
        keyExtractor={(g: any) => g.id}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title="Aún no tienes objetivos"
            message="Añade tu primer objetivo para empezar a hacer seguimiento de tu progreso."
          />
        }
        renderItem={({ item }: any) => (
          <Card accent>
            <AppText variant="h3" weight="bold">
              {item.goalType}
            </AppText>
            <AppText variant="body" tone="primary" weight="bold" style={{ marginTop: spacing.xs }}>
              {item.currentValue} / {item.targetValue}
            </AppText>
            {item.projectedWeeks != null && (
              <AppText variant="small" tone="muted" style={{ marginTop: spacing.sm }}>
                A este ritmo, llegas en ~{Math.round(item.projectedWeeks)} semanas
              </AppText>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
