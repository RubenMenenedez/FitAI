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
  Ring,
  MacroRing,
  colors,
  spacing,
  fontSize,
  fontWeight,
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

  const hasData = !!user;
  const calories = user?.dailyCalorieTarget ?? '—';
  const proteinG = Number(user?.dailyProteinTargetG ?? 0);
  const carbsG = Number(user?.dailyCarbsTargetG ?? 0);
  const fatG = Number(user?.dailyFatTargetG ?? 0);

  return (
    <Screen
      title="Hoy"
      subtitle="Tu resumen de hoy"
      scroll
      headerRight={
        <Button
          title="Salir"
          variant="ghost"
          fullWidth={false}
          size="md"
          onPress={handleSignOut}
        />
      }
    >
      {/* Calorie goal ring */}
      <Card style={{ alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg }}>
        <Ring
          size={188}
          strokeWidth={16}
          progress={hasData ? 1 : 0}
          color={colors.primary}
          center={
            <View style={{ alignItems: 'center' }}>
              <AppText style={{ fontSize: fontSize.display, fontWeight: fontWeight.heavy, color: colors.text }}>
                {calories}
              </AppText>
              <AppText variant="small" tone="muted" weight="semibold">
                kcal objetivo
              </AppText>
            </View>
          }
        />
      </Card>

      {/* Macro rings */}
      <Card style={{ marginBottom: spacing.lg }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: spacing.lg }}>
          Macros objetivo
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <MacroRing label="Proteína" value={proteinG} max={proteinG || 1} color={colors.protein} />
          <MacroRing label="Carbos" value={carbsG} max={carbsG || 1} color={colors.carbs} />
          <MacroRing label="Grasa" value={fatG} max={fatG || 1} color={colors.fat} />
        </View>
      </Card>

      {error ? (
        <AppText tone="danger" variant="small" style={{ marginTop: spacing.sm }}>
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}
