import { FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, Card, AppText, EmptyState, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

export default function ShoppingListScreen() {
  const t = useT();
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data } = useQuery({
    queryKey: ['shopping-list', mealPlanId],
    queryFn: async () => (await apiClient.get(`/shopping-list/${mealPlanId}`)).data,
    enabled: !!mealPlanId,
  });

  return (
    <Screen title={t('social.shopping.title')}>
      <FlatList
        data={data ?? []}
        keyExtractor={(i: any) => i.foodItemId}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title={t('social.shopping.emptyTitle')}
            message={t('social.shopping.emptyMessage')}
          />
        }
        renderItem={({ item }: any) => (
          <Card>
            <AppText variant="h3" weight="bold">
              {item.foodName}
            </AppText>
            <AppText variant="small" tone="muted" style={{ marginTop: spacing.xs }}>
              {Math.round(item.neededGrams)}g {t('social.shopping.needed')}
            </AppText>
            {item.suggestedPackage ? (
              <AppText variant="small" tone="success" weight="semibold" style={{ marginTop: spacing.sm }}>
                {t('social.shopping.buyPrefix')}{item.suggestedPackage.productNameRaw} (${item.suggestedPackage.price})
              </AppText>
            ) : (
              <AppText variant="small" tone="faint" style={{ marginTop: spacing.sm }}>
                {t('social.shopping.noPrice')}
              </AppText>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
