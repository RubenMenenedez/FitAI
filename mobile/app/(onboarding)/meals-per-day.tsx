import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { apiClient } from '../../src/api/client';
import { ME_QUERY_KEY } from '../../src/hooks/useOnboardingStatus';
import { Screen, Button, AppText, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

const MEAL_VALUES = ['3', '5_6'] as const;

export default function MealsPerDayScreen() {
  const { data, setData } = useOnboardingStore();
  const queryClient = useQueryClient();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MEAL_OPTIONS: { value: (typeof MEAL_VALUES)[number]; label: string }[] = [
    { value: '3', label: t('auth.mealsPerDay.3meals') },
    { value: '5_6', label: t('auth.mealsPerDay.56meals') },
  ];

  function handleFinish(mealsPerDay: '3' | '5_6') {
    if (isSubmitting) return;
    setError(null);

    const payload = { ...data, mealsPerDay };
    // Defensive guard: the gate routes users through the prior steps, but if
    // anything is missing the backend zod schema would 400 -- surface that as
    // a friendly message instead of an opaque failure.
    if (
      !payload.sex ||
      !payload.birthDate ||
      !payload.heightCm ||
      !payload.weightKg ||
      !payload.activityLevel ||
      !payload.goal
    ) {
      setError(t('auth.mealsPerDay.errorMissingData'));
      return;
    }

    setData({ mealsPerDay });
    setIsSubmitting(true);
    apiClient
      .post('/users/onboarding', payload)
      .then((res) => {
        // Seed the auth gate's /users/me cache with the just-updated user
        // (dailyCalorieTarget is now populated). That flips the gate's
        // onboarding guard, so expo-router moves us to the landing screen on
        // its own -- no manual navigation needed. Invalidate afterwards so the
        // cache reconciles with the server on the next refetch.
        queryClient.setQueryData(ME_QUERY_KEY, res.data);
        void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      })
      .catch(() => {
        setError(t('common.connectionError'));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Screen
      title={t('auth.mealsPerDay.title')}
      subtitle={t('auth.mealsPerDay.subtitle')}
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {MEAL_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            title={opt.label}
            variant="secondary"
            onPress={() => handleFinish(opt.value)}
            loading={isSubmitting}
            fullWidth
          />
        ))}
      </View>
    </Screen>
  );
}
