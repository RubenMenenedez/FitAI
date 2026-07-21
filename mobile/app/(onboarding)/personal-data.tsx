import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { Screen, Field, Button, Chip, AppText, spacing } from '../../src/ui';
import { useT } from '../../src/i18n';

const SEX_VALUES = ['male', 'female'] as const;

// Accepts only a well-formed YYYY-MM-DD that names a real calendar day in the
// past. Mirrors the backend zod schema (z.string().date() + "must be in the
// past") so we don't fire off an onboarding POST the API will reject.
function isValidPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  // Guard against roll-over (e.g. 2020-02-31 parsing to March).
  if (parsed.toISOString().slice(0, 10) !== value) return false;
  return parsed <= new Date();
}

export default function PersonalDataScreen() {
  const { data, setData } = useOnboardingStore();
  const t = useT();
  const [sex, setSex] = useState<'male' | 'female' | undefined>(data.sex);
  const [birthDate, setBirthDate] = useState(data.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(data.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(data.weightKg?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const SEX_OPTIONS: { value: (typeof SEX_VALUES)[number]; label: string }[] = [
    { value: 'male', label: t('auth.personalData.sexMale') },
    { value: 'female', label: t('auth.personalData.sexFemale') },
  ];

  function handleNext() {
    setError(null);

    if (!sex) {
      setError(t('auth.personalData.errorSex'));
      return;
    }
    if (!isValidPastDate(birthDate)) {
      setError(t('auth.personalData.errorBirthDate'));
      return;
    }
    const height = Number(heightCm);
    const weight = Number(weightKg);
    if (!Number.isFinite(height) || height <= 0) {
      setError(t('auth.personalData.errorHeight'));
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setError(t('auth.personalData.errorWeight'));
      return;
    }

    setData({ sex, birthDate, heightCm: height, weightKg: weight });
    router.push('/(onboarding)/activity-goal');
  }

  return (
    <Screen
      title={t('auth.personalData.title')}
      subtitle={t('auth.personalData.subtitle')}
      keyboard
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        {t('auth.personalData.sexLabel')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        {SEX_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={sex === opt.value}
            onPress={() => setSex(opt.value)}
          />
        ))}
      </View>

      <Field
        label={t('auth.personalData.birthDateLabel')}
        placeholder={t('auth.personalData.birthDatePlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        value={birthDate}
        onChangeText={setBirthDate}
      />

      <Field
        label={t('auth.personalData.heightLabel')}
        placeholder={t('auth.personalData.heightPlaceholder')}
        keyboardType="numeric"
        value={heightCm}
        onChangeText={setHeightCm}
      />

      <Field
        label={t('auth.personalData.weightLabel')}
        placeholder={t('auth.personalData.weightPlaceholder')}
        keyboardType="numeric"
        value={weightKg}
        onChangeText={setWeightKg}
      />

      <Button
        title={t('auth.personalData.nextButton')}
        onPress={handleNext}
        fullWidth
      />
    </Screen>
  );
}
