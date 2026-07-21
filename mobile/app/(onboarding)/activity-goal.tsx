import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { Screen, Button, Chip, AppText, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

const ACTIVITY_VALUES = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
const GOAL_VALUES = ['lose_fat', 'maintain', 'gain_muscle'] as const;

export default function ActivityGoalScreen() {
  const { data, setData } = useOnboardingStore();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  const ACTIVITY_OPTIONS: { value: (typeof ACTIVITY_VALUES)[number]; label: string }[] = [
    { value: 'sedentary', label: t('auth.activityGoal.sedentary') },
    { value: 'light', label: t('auth.activityGoal.light') },
    { value: 'moderate', label: t('auth.activityGoal.moderate') },
    { value: 'active', label: t('auth.activityGoal.active') },
    { value: 'very_active', label: t('auth.activityGoal.veryActive') },
  ];

  const GOAL_OPTIONS: { value: (typeof GOAL_VALUES)[number]; label: string }[] = [
    { value: 'lose_fat', label: t('auth.activityGoal.loseFat') },
    { value: 'maintain', label: t('auth.activityGoal.maintain') },
    { value: 'gain_muscle', label: t('auth.activityGoal.gainMuscle') },
  ];

  function handleNext() {
    setError(null);
    if (!data.activityLevel) {
      setError(t('auth.activityGoal.errorActivity'));
      return;
    }
    if (!data.goal) {
      setError(t('auth.activityGoal.errorGoal'));
      return;
    }
    router.push('/(onboarding)/meals-per-day');
  }

  return (
    <Screen
      title={t('auth.activityGoal.title')}
      subtitle={t('auth.activityGoal.subtitle')}
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        {t('auth.activityGoal.activityLabel')}
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
        {t('auth.activityGoal.goalLabel')}
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
        title={t('auth.activityGoal.nextButton')}
        onPress={handleNext}
        fullWidth
      />
    </Screen>
  );
}
