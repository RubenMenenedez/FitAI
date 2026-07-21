import { FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, Card, AppText, EmptyState, spacing } from '../../src/ui';

export default function ShoppingListScreen() {
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data } = useQuery({
    queryKey: ['shopping-list', mealPlanId],
    queryFn: async () => (await apiClient.get(`/shopping-list/${mealPlanId}`)).data,
    enabled: !!mealPlanId,
  });

  return (
    <Screen title="Lista de compra">
      <FlatList
        data={data ?? []}
        keyExtractor={(i: any) => i.foodItemId}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <EmptyState
            title="Lista vacía"
            message="Genera un plan de comidas para ver aquí los ingredientes que necesitas comprar."
          />
        }
        renderItem={({ item }: any) => (
          <Card>
            <AppText variant="h3" weight="bold">
              {item.foodName}
            </AppText>
            <AppText variant="small" tone="muted" style={{ marginTop: spacing.xs }}>
              {Math.round(item.neededGrams)}g necesarios
            </AppText>
            {item.suggestedPackage ? (
              <AppText variant="small" tone="success" weight="semibold" style={{ marginTop: spacing.sm }}>
                Comprar: {item.suggestedPackage.productNameRaw} (${item.suggestedPackage.price})
              </AppText>
            ) : (
              <AppText variant="small" tone="faint" style={{ marginTop: spacing.sm }}>
                Precio no disponible hoy
              </AppText>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
