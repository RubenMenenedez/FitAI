import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { requestHealthPermissionsAndSync } from '../../src/health/healthSync';
import {
  AppText,
  Button,
  Card,
  Field,
  Segmented,
  LineChart,
  EmptyState,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  FlameIcon,
} from '../../src/ui';
import { useT } from '../../src/i18n';

type WeighIn = { id: string; recordedAt: string; weightKg: number; bmi: number; bmiCategory: string };
type Tab = 'weight' | 'measures' | 'photos';

export default function ProgressScreen() {
  const t = useT();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('weight');
  const [weightKg, setWeightKg] = useState('');

  const { data: weighIns } = useQuery({
    queryKey: ['weigh-ins'],
    queryFn: async () => (await apiClient.get('/weigh-ins')).data as WeighIn[],
  });
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const recordWeighIn = useMutation({
    mutationFn: () => apiClient.post('/weigh-ins', { weightKg: Number(weightKg) }),
    onSuccess: () => { setWeightKg(''); queryClient.invalidateQueries({ queryKey: ['weigh-ins'] }); },
  });

  // Chronological series (API returns newest-first per the history list).
  const series = [...(weighIns ?? [])].sort((a, b) => +new Date(a.recordedAt) - +new Date(b.recordedAt));
  const startW = series[0]?.weightKg;
  const currentW = series[series.length - 1]?.weightKg;
  const latestBmi = series[series.length - 1]?.bmi;
  const delta = startW != null && currentW != null ? currentW - startW : undefined;

  const targetW = user?.targetWeightKg as number | undefined;
  const goalPct =
    startW != null && currentW != null && targetW != null && startW !== targetW
      ? Math.max(0, Math.min(1, (startW - currentW) / (startW - targetW)))
      : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" weight="heavy" style={{ marginBottom: spacing.lg }}>{t('tabs.progress.title')}</AppText>

        <View style={{ marginBottom: spacing.lg }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={[
              { value: 'weight', label: t('app.progress.tabWeight') },
              { value: 'measures', label: t('app.progress.tabMeasures') },
              { value: 'photos', label: t('app.progress.tabPhotos') },
            ]}
          />
        </View>

        {tab !== 'weight' ? (
          <EmptyState title={t('app.progress.soon')} />
        ) : series.length === 0 ? (
          <EmptyState title={t('tabs.progress.emptyTitle')} message={t('tabs.progress.emptyMessage')} />
        ) : (
          <>
            {/* Current weight + trend */}
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                <View>
                  <AppText variant="small" tone="muted" weight="semibold">{t('app.progress.current')}</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs }}>
                    <AppText style={{ fontSize: fontSize.display, fontWeight: fontWeight.heavy }}>{currentW}</AppText>
                    <AppText variant="body" tone="muted" weight="semibold">kg</AppText>
                  </View>
                </View>
                {delta != null ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="body" weight="bold" style={{ color: delta <= 0 ? colors.successDark : colors.danger }}>
                      {`${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(1)} kg`}
                    </AppText>
                    <AppText variant="tiny" tone="muted">{t('app.progress.sinceStart')}</AppText>
                  </View>
                ) : null}
              </View>
              <LineChart data={series.map((s) => s.weightKg)} color={colors.primary} />
            </Card>

            {/* IMC + streak */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
              <Card style={{ flex: 1, alignItems: 'center' }}>
                <AppText variant="small" tone="muted" weight="semibold">{t('app.progress.bmi')}</AppText>
                <AppText style={{ fontSize: fontSize.h1, fontWeight: fontWeight.heavy, marginTop: spacing.xs }}>{latestBmi ?? '—'}</AppText>
                <AppText variant="tiny" weight="semibold" style={{ color: colors.successDark }}>{t('app.progress.healthy')}</AppText>
              </Card>
              <Card style={{ flex: 1, alignItems: 'center' }}>
                <AppText variant="small" tone="muted" weight="semibold">{t('app.progress.streak')}</AppText>
                <AppText style={{ fontSize: fontSize.h1, fontWeight: fontWeight.heavy, marginTop: spacing.xs }}>{user?.currentStreak ?? series.length}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <FlameIcon size={13} color={colors.fat} />
                  <AppText variant="tiny" tone="muted" weight="semibold">{t('app.progress.days')}</AppText>
                </View>
              </Card>
            </View>

            {/* Goal */}
            {goalPct != null ? (
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <AppText variant="small" weight="semibold" tone="muted">{t('app.progress.goal')}</AppText>
                  <AppText variant="small" weight="bold" style={{ color: colors.primary }}>{`${Math.round(goalPct * 100)}%`}</AppText>
                </View>
                <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                  <View style={{ width: `${goalPct * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill }} />
                </View>
                <AppText variant="tiny" tone="muted" style={{ marginTop: spacing.xs }}>{`${currentW} → ${targetW} kg`}</AppText>
              </Card>
            ) : null}
          </>
        )}

        {/* Record weigh-in */}
        {tab === 'weight' ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <AppText variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>{t('app.progress.addWeighIn')}</AppText>
            <Field placeholder="0.0" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
            <Button
              title={t('app.progress.addWeighIn')}
              variant="primary"
              loading={recordWeighIn.isPending}
              disabled={!weightKg}
              onPress={() => recordWeighIn.mutate()}
            />
          </Card>
        ) : null}

        <Button
          title={t('tabs.progress.syncHealth')}
          variant="secondary"
          onPress={async () => {
            try {
              await requestHealthPermissionsAndSync();
              queryClient.invalidateQueries({ queryKey: ['weigh-ins'] });
            } catch { /* native module absent in Expo Go — expected */ }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
