import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import {
  AppText,
  Card,
  Button,
  Segmented,
  EmptyState,
  colors,
  spacing,
  radius,
} from '../../src/ui';
import { useT } from '../../src/i18n';

type Tab = 'week' | 'recipe' | 'category';

export default function ShoppingListScreen() {
  const t = useT();
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const [tab, setTab] = useState<Tab>('week');

  const { data } = useQuery({
    queryKey: ['shopping-list', mealPlanId],
    queryFn: async () => (await apiClient.get(`/shopping-list/${mealPlanId}`)).data,
    enabled: !!mealPlanId,
  });

  const items: any[] = data ?? [];
  const total = items.reduce((sum, i) => sum + (Number(i.suggestedPackage?.price) || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" weight="heavy" style={{ marginBottom: spacing.lg }}>{t('app.shop.title')}</AppText>

        <View style={{ marginBottom: spacing.lg }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={[
              { value: 'week', label: t('app.shop.tabWeek') },
              { value: 'recipe', label: t('app.shop.tabRecipe') },
              { value: 'category', label: t('app.shop.tabCategory') },
            ]}
          />
        </View>

        {items.length === 0 ? (
          <EmptyState title={t('social.shopping.emptyTitle')} message={t('social.shopping.emptyMessage')} />
        ) : (
          <>
            {/* Stat row */}
            <Card style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
              <Stat value={`${items.length}`} label={t('app.shop.ingredients')} />
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <Stat value={`€${total.toFixed(2)}`} label={t('app.shop.approxPrice')} />
            </Card>

            {items.map((item) => (
              <Card key={item.foodItemId} style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="bold">{item.foodName}</AppText>
                  <AppText variant="tiny" tone="muted" style={{ marginTop: 2 }}>
                    {`${Math.round(item.neededGrams)} g ${t('app.shop.needed')}`}
                  </AppText>
                  {item.suggestedPackage ? (
                    <AppText variant="small" tone="muted" style={{ marginTop: spacing.xs }}>
                      {item.suggestedPackage.productNameRaw}
                    </AppText>
                  ) : null}
                </View>
                {item.suggestedPackage ? (
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <AppText variant="body" weight="heavy">{`€${item.suggestedPackage.price}`}</AppText>
                    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.primarySoft }}>
                      <AppText variant="tiny" weight="bold" style={{ color: colors.primary }}>{t('app.shop.bestPrice')}</AppText>
                    </View>
                  </View>
                ) : (
                  <AppText variant="small" tone="faint">{t('social.shopping.noPrice')}</AppText>
                )}
              </Card>
            ))}

            <Button title={t('app.shop.compare')} variant="primary" onPress={() => {}} style={{ marginTop: spacing.sm }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="h3" weight="heavy">{value}</AppText>
      <AppText variant="tiny" tone="muted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}
