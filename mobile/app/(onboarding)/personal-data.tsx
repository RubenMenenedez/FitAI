import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { Screen, Field, Button, Chip, AppText, spacing } from '../../src/ui';

const SEX_OPTIONS = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
] as const;

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
  const [sex, setSex] = useState<'male' | 'female' | undefined>(data.sex);
  const [birthDate, setBirthDate] = useState(data.birthDate ?? '');
  const [heightCm, setHeightCm] = useState(data.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(data.weightKg?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    setError(null);

    if (!sex) {
      setError('Selecciona tu sexo.');
      return;
    }
    if (!isValidPastDate(birthDate)) {
      setError('Introduce una fecha de nacimiento válida (AAAA-MM-DD).');
      return;
    }
    const height = Number(heightCm);
    const weight = Number(weightKg);
    if (!Number.isFinite(height) || height <= 0) {
      setError('Introduce una altura válida en cm.');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setError('Introduce un peso válido en kg.');
      return;
    }

    setData({ sex, birthDate, heightCm: height, weightKg: weight });
    router.push('/(onboarding)/activity-goal');
  }

  return (
    <Screen
      title="Tus datos"
      subtitle="Necesitamos conocerte un poco mejor"
      keyboard
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
        Sexo
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
        label="Fecha de nacimiento"
        placeholder="AAAA-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        value={birthDate}
        onChangeText={setBirthDate}
      />

      <Field
        label="Altura (cm)"
        placeholder="Altura (cm)"
        keyboardType="numeric"
        value={heightCm}
        onChangeText={setHeightCm}
      />

      <Field
        label="Peso (kg)"
        placeholder="Peso (kg)"
        keyboardType="numeric"
        value={weightKg}
        onChangeText={setWeightKg}
      />

      <Button
        title="Siguiente"
        onPress={handleNext}
        fullWidth
      />
    </Screen>
  );
}
