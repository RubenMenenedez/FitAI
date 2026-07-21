import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
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
import { useT, LanguageToggle } from '../../src/i18n';
import { AdBanner } from '../../src/ads/adsClient';

export default function DashboardScreen() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  function handleSignOut() {
    setError(null);
    signOut().catch(() => {
      setError(t('tabs.dashboard.signOutError'));
    });
  }

  const hasData = !!user;
  const isFree = user?.subscriptionStatus === 'free';
  const calories = user?.dailyCalorieTarget ?? '—';
  const proteinG = Number(user?.dailyProteinTargetG ?? 0);
  const carbsG = Number(user?.dailyCarbsTargetG ?? 0);
  const fatG = Number(user?.dailyFatTargetG ?? 0);

  return (
    <Screen
      title={t('tabs.dashboard.title')}
      subtitle={t('tabs.dashboard.subtitle')}
      scroll
      headerRight={
        <Button
          title={t('tabs.dashboard.signOut')}
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
                {t('tabs.dashboard.kcalGoal')}
              </AppText>
            </View>
          }
        />
      </Card>

      {/* Macro rings */}
      <Card style={{ marginBottom: spacing.lg }}>
        <AppText variant="h3" weight="bold" style={{ marginBottom: spacing.lg }}>
          {t('tabs.dashboard.macrosTitle')}
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <MacroRing label={t('tabs.dashboard.protein')} value={proteinG} max={proteinG || 1} color={colors.protein} />
          <MacroRing label={t('tabs.dashboard.carbs')} value={carbsG} max={carbsG || 1} color={colors.carbs} />
          <MacroRing label={t('tabs.dashboard.fat')} value={fatG} max={fatG || 1} color={colors.fat} />
        </View>
      </Card>

      {error ? (
        <AppText tone="danger" variant="small" style={{ marginTop: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <LanguageToggle />
      </View>

      {/* Free-plan: premium upsell CTA + banner ad */}
      {isFree ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Button
            title={t('tabs.premium.goPremium')}
            variant="primary"
            onPress={() => router.push('/(tabs)/paywall')}
          />
          <View style={{ alignItems: 'center' }}>
            <AdBanner />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
