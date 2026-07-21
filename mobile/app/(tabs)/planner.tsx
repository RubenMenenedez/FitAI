import { View, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Screen, AppText, Button, Card, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

const DAY_KEYS = [
  'tabs.planner.monday',
  'tabs.planner.tuesday',
  'tabs.planner.wednesday',
  'tabs.planner.thursday',
  'tabs.planner.friday',
  'tabs.planner.saturday',
  'tabs.planner.sunday',
] as const;

export default function PlannerScreen() {
  const queryClient = useQueryClient();
  const t = useT();

  const generatePlan = useMutation({
    mutationFn: () => apiClient.post('/meal-plans/generate', { weekStartDate: new Date().toISOString().slice(0, 10) }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
      const planId = (response as any)?.data?.id;
      if (planId) router.push({ pathname: '/(tabs)/shopping-list', params: { mealPlanId: String(planId) } });
    },
  });

  return (
    <Screen title={t('tabs.planner.title')} scroll>
      <Button
        title={t('tabs.planner.generateButton')}
        variant="success"
        loading={generatePlan.isPending}
        onPress={() => generatePlan.mutate()}
        style={{ marginBottom: spacing.xl }}
      />

      <FlatList
        data={DAY_KEYS}
        keyExtractor={(d) => d}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item, index }) => (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFF1E7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText variant="small" weight="bold" tone="primary">
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="body" weight="semibold">
                {t(item)}
              </AppText>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
