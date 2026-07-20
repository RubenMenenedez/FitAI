import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';

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
    <View style={styles.container}>
      <Text style={styles.title}>Tus datos</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Sexo</Text>
      <View style={styles.optionRow}>
        {SEX_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.option, sex === opt.value && styles.optionSelected]}
            onPress={() => setSex(opt.value)}
          >
            <Text style={[styles.optionText, sex === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <TextInput
        style={styles.input}
        placeholder="AAAA-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        value={birthDate}
        onChangeText={setBirthDate}
      />

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="Altura (cm)"
        keyboardType="numeric"
        value={heightCm}
        onChangeText={setHeightCm}
      />

      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="Peso (kg)"
        keyboardType="numeric"
        value={weightKg}
        onChangeText={setWeightKg}
      />

      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#111',
    backgroundColor: '#111',
  },
  optionText: {
    fontSize: 16,
    color: '#111',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#c0392b',
  },
});
