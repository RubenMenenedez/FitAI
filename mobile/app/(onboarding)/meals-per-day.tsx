import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { apiClient } from '../../src/api/client';
import { ME_QUERY_KEY } from '../../src/hooks/useOnboardingStatus';
import { Screen, Button, AppText, spacing } from '../../src/ui';

const MEAL_OPTIONS = [
  { value: '3', label: '3 comidas (desayuno, comida, cena)' },
  { value: '5_6', label: '5-6 comidas (con snacks)' },
] as const;

export default function MealsPerDayScreen() {
  const { data, setData } = useOnboardingStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError('Faltan datos. Vuelve atrás y completa los pasos anteriores.');
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
        setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Screen
      title="¿Cuántas comidas al día prefieres?"
      subtitle="Adaptaremos tu plan a tu rutina"
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
