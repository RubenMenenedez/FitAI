import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOnboardingStore } from '../../src/state/onboardingStore';

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
    <View style={styles.container}>
      <Text style={styles.title}>Actividad y objetivo</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Nivel de actividad</Text>
      {ACTIVITY_OPTIONS.map((opt) => {
        const selected = data.activityLevel === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setData({ activityLevel: opt.value })}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.label}>Objetivo</Text>
      {GOAL_OPTIONS.map((opt) => {
        const selected = data.goal === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setData({ goal: opt.value })}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}

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
    gap: 8,
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
    marginTop: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
