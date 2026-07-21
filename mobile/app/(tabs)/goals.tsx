import { FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, Card, AppText, EmptyState, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

export default function GoalsScreen() {
  const t = useT();
  const { data: goals } = useQuery({ queryKey: ['goals'], queryFn: async () => (await apiClient.get('/goals')).data });

  return (
    <Screen title={t('social.goals.title')}>
      <FlatList
        data={goals ?? []}
        keyExtractor={(g: any) => g.id}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title={t('social.goals.emptyTitle')}
            message={t('social.goals.emptyMessage')}
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
                {t('social.goals.projectedWeeksPrefix')}{Math.round(item.projectedWeeks)}{t('social.goals.projectedWeeksSuffix')}
              </AppText>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
