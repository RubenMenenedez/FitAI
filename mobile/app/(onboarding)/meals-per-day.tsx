import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { apiClient } from '../../src/api/client';
import { ME_QUERY_KEY } from '../../src/hooks/useOnboardingStatus';

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
      .then(async () => {
        // Force the auth gate's /users/me query to refetch so it now sees the
        // completed onboarding (dailyCalorieTarget populated) and lets us into
        // the landing screen instead of bouncing back into onboarding.
        await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
        router.replace('/');
      })
      .catch(() => {
        setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuántas comidas al día prefieres?</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {MEAL_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.option, isSubmitting && styles.optionDisabled]}
          onPress={() => handleFinish(opt.value)}
          disabled={isSubmitting}
        >
          <Text style={styles.optionText}>{opt.label}</Text>
        </Pressable>
      ))}

      {isSubmitting ? <Text style={styles.hint}>Guardando...</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  hint: {
    textAlign: 'center',
    color: '#555',
  },
  error: {
    color: '#c0392b',
  },
});
