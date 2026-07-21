import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  AppText,
  Card,
  Button,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  GearIcon,
  TargetIcon,
  HeartIcon,
  ChevronRightIcon,
  SparkleIcon,
  UserIcon,
} from '../../src/ui';
import { useT, LanguageToggle } from '../../src/i18n';
import { AdBanner } from '../../src/ads/adsClient';
import { presentRevenueCatPaywall, presentCustomerCenter } from '../../src/purchases/rcUi';

export default function ProfileScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const isFree = !user || user.subscriptionStatus === 'free';
  const name = user?.name ?? user?.displayName ?? user?.email?.split('@')[0] ?? '—';
  const weightKg = user?.weightKg;
  const heightCm = user?.heightCm;
  const age = user?.birthDate ? yearsSince(user.birthDate) : undefined;
  const goalLabel = goalToLabel(user?.goal, t);

  async function handleGoPremium() {
    const result = await presentRevenueCatPaywall();
    if (result === null) {
      router.push('/(tabs)/paywall');
      return;
    }
    if (result === 'PURCHASED' || result === 'RESTORED') {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  }

  async function handleManage() {
    await presentCustomerCenter();
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  function handleSignOut() {
    setError(null);
    signOut().catch(() => setError(t('tabs.dashboard.signOutError')));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <AppText variant="h1" weight="heavy">{t('app.profile.title')}</AppText>
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel={t('app.profile.settings')}>
            <GearIcon size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Identity */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <UserIcon size={40} color={colors.primary} />
          </View>
          <AppText variant="h2" weight="heavy">{name}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: isFree ? colors.surfaceAlt : colors.primarySoft }}>
            {!isFree ? <SparkleIcon size={14} color={colors.primary} /> : null}
            <AppText variant="tiny" weight="bold" style={{ color: isFree ? colors.textMuted : colors.primary }}>
              {isFree ? t('app.profile.free') : t('app.profile.premium')}
            </AppText>
          </View>
        </View>

        {/* Stat row */}
        <Card style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
          <StatCell value={weightKg != null ? `${weightKg}` : '—'} unit="kg" label={t('app.profile.weight')} />
          <Divider />
          <StatCell value={heightCm != null ? `${(heightCm / 100).toFixed(2)}` : '—'} unit="m" label={t('app.profile.height')} />
          <Divider />
          <StatCell value={age != null ? `${age}` : '—'} unit={t('app.profile.years')} label={t('app.profile.age')} />
        </Card>

        {/* Rows */}
        <Card padded={false} style={{ marginBottom: spacing.lg }}>
          <Row Icon={TargetIcon} label={t('app.profile.goalRow')} value={goalLabel} onPress={() => router.push('/(tabs)/goals')} />
          <Hairline />
          <Row Icon={HeartIcon} iconColor={colors.danger} label={t('app.profile.appleHealth')} value={t('app.profile.notConnected')} onPress={() => router.push('/(tabs)/progress')} />
          <Hairline />
          <Row Icon={GearIcon} label={t('app.profile.settings')} onPress={() => {}} />
        </Card>

        {/* Premium banner / manage */}
        {isFree ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleGoPremium}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              borderRadius: radius.xl,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginBottom: spacing.lg,
            })}
          >
            <SparkleIcon size={26} color={colors.white} />
            <View style={{ flex: 1 }}>
              <AppText style={{ color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold }}>
                {t('app.profile.premiumBanner')}
              </AppText>
              <AppText style={{ color: colors.white, opacity: 0.85, fontSize: fontSize.small }}>
                {t('app.profile.premiumBannerSub')}
              </AppText>
            </View>
            <ChevronRightIcon size={22} color={colors.white} />
          </Pressable>
        ) : (
          <Button title={t('tabs.premium.manage')} variant="secondary" onPress={handleManage} style={{ marginBottom: spacing.lg }} />
        )}

        {/* Free-plan banner ad */}
        {isFree ? (
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <AdBanner />
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <LanguageToggle />
        </View>

        {error ? (
          <AppText tone="danger" variant="small" center style={{ marginBottom: spacing.md }}>{error}</AppText>
        ) : null}

        <Button title={t('app.profile.signOut')} variant="ghost" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <AppText variant="h3" weight="heavy">{value}</AppText>
        <AppText variant="tiny" tone="muted" weight="semibold">{unit}</AppText>
      </View>
      <AppText variant="tiny" tone="muted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 2 }} />;
}

function Hairline() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 56 }} />;
}

function Row({
  Icon,
  iconColor = colors.text,
  label,
  value,
  onPress,
}: {
  Icon: (p: { size?: number; color?: string }) => React.ReactNode;
  iconColor?: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{Icon({ size: 22, color: iconColor })}</View>
      <AppText variant="body" weight="semibold" style={{ flex: 1 }}>{label}</AppText>
      {value ? <AppText variant="small" tone="muted">{value}</AppText> : null}
      <ChevronRightIcon size={20} color={colors.textFaint} />
    </Pressable>
  );
}

function yearsSince(isoDate: string): number | undefined {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function goalToLabel(goal: string | undefined, t: (k: string) => string): string {
  switch (goal) {
    case 'lose_fat': return t('app.profile.goalLoseFat');
    case 'gain_muscle': return t('app.profile.goalGainMuscle');
    case 'maintain': return t('app.profile.goalMaintain');
    default: return '—';
  }
}
