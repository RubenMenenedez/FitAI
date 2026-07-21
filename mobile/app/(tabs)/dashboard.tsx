import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  Screen,
  AppText,
  Button,
  Card,
  Stat,
  ProgressBar,
  colors,
  spacing,
} from '../../src/ui';

export default function DashboardScreen() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    setError(null);
    signOut().catch(() => {
      setError('No se pudo cerrar sesión. Inténtalo de nuevo.');
    });
  }

  const proteinG = user?.dailyProteinTargetG ?? 0;
  const carbsG = user?.dailyCarbsTargetG ?? 0;
  const fatG = user?.dailyFatTargetG ?? 0;

  return (
    <Screen
      title="Hoy"
      subtitle="Tu resumen de hoy"
      scroll
      headerRight={
        <Button
          title="Cerrar sesión"
          variant="ghost"
          fullWidth={false}
          size="md"
          onPress={handleSignOut}
        />
      }
    >
      {/* Calorie target card */}
      <Card accent style={{ marginBottom: spacing.lg }}>
        <Stat
          value={user?.dailyCalorieTarget ?? '—'}
          unit="kcal"
          label="Calorías objetivo"
          tone="primary"
        />
      </Card>

      {/* Macros card */}
      <Card style={{ marginBottom: spacing.lg }}>
        <AppText variant="h3" weight="semibold" style={{ marginBottom: spacing.lg }}>
          Macros objetivo
        </AppText>
        <ProgressBar
          label="Proteína"
          value={proteinG}
          max={proteinG || 1}
          color={colors.primary}
          valueLabel={user ? `${proteinG} g` : '— g'}
        />
        <ProgressBar
          label="Carbohidratos"
          value={carbsG}
          max={carbsG || 1}
          color={colors.success}
          valueLabel={user ? `${carbsG} g` : '— g'}
        />
        <ProgressBar
          label="Grasa"
          value={fatG}
          max={fatG || 1}
          color={colors.warning}
          valueLabel={user ? `${fatG} g` : '— g'}
        />
      </Card>

      {error ? (
        <View style={{ marginTop: spacing.sm }}>
          <AppText tone="danger" variant="small">
            {error}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}
