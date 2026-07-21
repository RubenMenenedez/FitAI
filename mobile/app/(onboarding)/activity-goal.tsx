import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { Screen, Button, Chip, AppText, spacing } from '../../src/ui';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'light', label: 'Ligero' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'active', label: 'Activo' },
  { value: 'very_active', label: 'Muy activo' },
] as const;

const GOAL_OPTIONS = [
  { value: 'lose_fat', label: 'Bajar grasa' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain_muscle', label: 'Ganar músculo' },
] as const;

export default function ActivityGoalScreen() {
  const { data, setData } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    setError(null);
    if (!data.activityLevel) {
      setError('Selecciona tu nivel de actividad.');
      return;
    }
    if (!data.goal) {
      setError('Selecciona tu objetivo.');
      return;
    }
    router.push('/(onboarding)/meals-per-day');
  }

  return (
    <Screen
      title="Actividad y objetivo"
      subtitle="Personaliza tu plan de nutrición"
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        Nivel de actividad
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {ACTIVITY_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={data.activityLevel === opt.value}
            onPress={() => setData({ activityLevel: opt.value })}
          />
        ))}
      </View>

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        Objetivo
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {GOAL_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={data.goal === opt.value}
            onPress={() => setData({ goal: opt.value })}
          />
        ))}
      </View>

      <Button
        title="Siguiente"
        onPress={handleNext}
        fullWidth
      />
    </Screen>
  );
}
