import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  PlusIcon,
} from '../../src/ui';
import { useT } from '../../src/i18n';

const DAY_KEYS = ['app.day.mon', 'app.day.tue', 'app.day.wed', 'app.day.thu', 'app.day.fri', 'app.day.sat', 'app.day.sun'] as const;
const MEAL_SLOTS = [
  { key: 'breakfast', labelKey: 'app.planner.breakfast', emoji: '🥣' },
  { key: 'lunch', labelKey: 'app.planner.lunch', emoji: '🍗' },
  { key: 'dinner', labelKey: 'app.planner.dinner', emoji: '🐟' },
] as const;

export default function PlannerScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
  const [selectedDay, setSelectedDay] = useState(todayIdx);

  const { data: plan } = useQuery({
    queryKey: ['meal-plan'],
    queryFn: async () => (await apiClient.get('/meal-plans/current')).data,
    retry: false,
  });

  const generatePlan = useMutation({
    mutationFn: () => apiClient.post('/meal-plans/generate', { weekStartDate: new Date().toISOString().slice(0, 10) }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
      const planId = (response as any)?.data?.id;
      if (planId) router.push({ pathname: '/(tabs)/shopping-list', params: { mealPlanId: String(planId) } });
    },
  });

  // Meals for the selected day if the plan provides them; else null (→ placeholder cards).
  const dayMeals = plan?.days?.[selectedDay]?.meals ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" weight="heavy" style={{ marginBottom: spacing.lg }}>{t('app.planner.title')}</AppText>

        {/* Day selector */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          {DAY_KEYS.map((dk, i) => {
            const active = i === selectedDay;
            const isToday = i === todayIdx;
            return (
              <Pressable
                key={dk}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedDay(i)}
                style={{ alignItems: 'center', gap: 4 }}
              >
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <AppText variant="small" weight="bold" style={{ color: active ? colors.white : colors.text }}>{t(dk)}</AppText>
                </View>
                {isToday ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} /> : <View style={{ height: 4 }} />}
              </Pressable>
            );
          })}
        </View>

        <AppText variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>
          {`${selectedDay === todayIdx ? `${t('app.planner.today')}, ` : ''}${fullDay(selectedDay, t)}`}
        </AppText>

        {!plan ? (
          <>
            <EmptyState title={t('app.planner.empty')} style={{ marginBottom: spacing.lg }} />
            <Button title={t('app.planner.generate')} variant="primary" loading={generatePlan.isPending} onPress={() => generatePlan.mutate()} />
          </>
        ) : (
          <>
            {MEAL_SLOTS.map((slot) => {
              const meal = dayMeals?.[slot.key];
              return (
                <Card key={slot.key} style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText style={{ fontSize: 28 }}>{slot.emoji}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <AppText variant="small" tone="muted" weight="semibold">{t(slot.labelKey)}</AppText>
                      {meal?.calories != null ? <AppText variant="small" tone="muted" weight="semibold">{`${meal.calories} kcal`}</AppText> : null}
                    </View>
                    <AppText variant="body" weight="bold" style={{ marginTop: 2 }}>{meal?.name ?? '—'}</AppText>
                    {meal?.tag ? <AppText variant="tiny" weight="semibold" style={{ color: colors.primary, marginTop: 2 }}>{meal.tag}</AppText> : null}
                  </View>
                </Card>
              );
            })}

            <Pressable
              accessibilityRole="button"
              onPress={() => generatePlan.mutate()}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
                paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
                borderStyle: 'dashed', opacity: pressed ? 0.7 : 1, marginTop: spacing.xs,
              })}
            >
              <PlusIcon size={18} color={colors.primary} />
              <AppText variant="small" weight="bold" style={{ color: colors.primary }}>{t('app.planner.change')}</AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function fullDay(i: number, t: (k: string) => string): string {
  const keys = ['tabs.planner.monday', 'tabs.planner.tuesday', 'tabs.planner.wednesday', 'tabs.planner.thursday', 'tabs.planner.friday', 'tabs.planner.saturday', 'tabs.planner.sunday'];
  return t(keys[i]);
}
