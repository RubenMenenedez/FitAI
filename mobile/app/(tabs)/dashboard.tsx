import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import {
  AppText,
  Card,
  BrandLogo,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  BellIcon,
  FlameIcon,
  CameraIcon,
  CalendarIcon,
  CartIcon,
  ChartIcon,
  UsersIcon,
  ChevronRightIcon,
} from '../../src/ui';
import { useT } from '../../src/i18n';

export default function DashboardScreen() {
  const t = useT();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const name = user?.name ?? user?.displayName ?? user?.email?.split('@')[0] ?? '';
  const calTarget = Number(user?.dailyCalorieTarget ?? 0);
  const calConsumed = Number(user?.consumedCaloriesToday ?? 0);
  const streak = Number(user?.currentStreak ?? 0);

  const macros = [
    { key: 'protein', label: t('tabs.dashboard.protein'), consumed: Number(user?.consumedProteinG ?? 0), target: Number(user?.dailyProteinTargetG ?? 0), color: colors.protein },
    { key: 'carbs', label: t('tabs.dashboard.carbs'), consumed: Number(user?.consumedCarbsG ?? 0), target: Number(user?.dailyCarbsTargetG ?? 0), color: colors.carbs },
    { key: 'fat', label: t('tabs.dashboard.fat'), consumed: Number(user?.consumedFatG ?? 0), target: Number(user?.dailyFatTargetG ?? 0), color: colors.fat },
  ];

  const calPct = calTarget > 0 ? Math.round((calConsumed / calTarget) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: brand + notifications */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <BrandLogo size={26} />
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Notificaciones">
            <BellIcon size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Greeting */}
        <AppText variant="h1" weight="heavy">{`${t('app.home.hi')}${name ? `, ${name}` : ''}! 👋`}</AppText>
        <AppText variant="body" tone="muted" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
          {t('app.home.subtitle')}
        </AppText>

        {/* Calorie card */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <AppText variant="small" tone="muted" weight="semibold">{t('app.home.caloriesToday')}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs }}>
                <AppText style={{ fontSize: fontSize.h1, fontWeight: fontWeight.heavy, color: colors.text }}>
                  {calConsumed.toLocaleString()}
                </AppText>
                <AppText variant="small" tone="muted" weight="semibold">
                  {`/ ${calTarget.toLocaleString()} ${t('app.home.kcal')}`}
                </AppText>
              </View>
            </View>
            <AppText style={{ fontSize: fontSize.h2, fontWeight: fontWeight.heavy, color: colors.primary }}>
              {`${calPct}%`}
            </AppText>
          </View>
          <TrackBar pct={calPct / 100} color={colors.primary} style={{ marginTop: spacing.md }} />

          {/* Macros */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            {macros.map((m) => (
              <View key={m.key} style={{ flex: 1 }}>
                <AppText variant="tiny" tone="muted" weight="semibold">{m.label}</AppText>
                <AppText variant="small" weight="bold" style={{ marginTop: 2 }}>
                  {`${Math.round(m.consumed)} / ${Math.round(m.target)} g`}
                </AppText>
                <TrackBar pct={m.target > 0 ? m.consumed / m.target : 0} color={m.color} style={{ marginTop: spacing.xs }} height={6} />
              </View>
            ))}
          </View>
        </Card>

        {/* Streak */}
        <Card
          onPress={() => router.push('/(tabs)/progress')}
          style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <FlameIcon size={24} color={colors.fat} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="bold">{`${streak} ${t('app.home.streakTitle')} 🔥`}</AppText>
            <AppText variant="small" tone="muted">{t('app.home.streakSub')}</AppText>
          </View>
          <ChevronRightIcon size={22} color={colors.textFaint} />
        </Card>

        {/* Scan CTA */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/scan')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
            borderRadius: radius.xl,
            paddingVertical: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          })}
        >
          <CameraIcon size={24} color={colors.white} />
          <AppText style={{ color: colors.white, fontSize: fontSize.body, fontWeight: fontWeight.bold }}>
            {t('app.home.scanCta')}
          </AppText>
        </Pressable>

        {/* Quick actions grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <QuickAction label={t('app.home.quick.plan')} Icon={CalendarIcon} onPress={() => router.push('/(tabs)/planner')} />
          <QuickAction label={t('app.home.quick.list')} Icon={CartIcon} onPress={() => router.push('/(tabs)/shopping-list')} />
          <QuickAction label={t('app.home.quick.progress')} Icon={ChartIcon} onPress={() => router.push('/(tabs)/progress')} />
          <QuickAction label={t('app.home.quick.community')} Icon={UsersIcon} onPress={() => router.push('/(tabs)/groups')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrackBar({ pct, color, height = 10, style }: { pct: number; color: string; height?: number; style?: object }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View style={[{ height, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }, style]}>
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: color, borderRadius: radius.pill }} />
    </View>
  );
}

function QuickAction({
  label,
  Icon,
  onPress,
}: {
  label: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        width: '47%',
        flexGrow: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        {Icon({ size: 20, color: colors.primary })}
      </View>
      <AppText variant="small" weight="semibold" style={{ flex: 1 }}>{label}</AppText>
    </Pressable>
  );
}
