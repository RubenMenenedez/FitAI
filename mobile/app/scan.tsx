import { useState } from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  AppText,
  Card,
  Button,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  CloseIcon,
  CameraIcon,
  SparkleIcon,
} from '../src/ui';
import { useT } from '../src/i18n';

// Demo detection — replaced by the real vision model in a later phase.
const DEMO_ITEMS = [
  { name: 'Pechuga de pollo', grams: 180, kcal: 296 },
  { name: 'Arroz integral', grams: 210, kcal: 273 },
  { name: 'Brócoli', grams: 100, kcal: 34 },
];
const DEMO_TOTAL = { kcal: 603, protein: 52, carbs: 58, fat: 14 };

export default function ScanScreen() {
  const t = useT();
  const [photo, setPhoto] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <AppText variant="h2" weight="heavy">{t('app.scan.title')}</AppText>
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => router.back()}>
            <CloseIcon size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Photo area */}
        <Pressable
          accessibilityRole="button"
          onPress={pickPhoto}
          style={{ borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg, backgroundColor: colors.surfaceAlt, height: 220, alignItems: 'center', justifyContent: 'center' }}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <CameraIcon size={40} color={colors.textFaint} />
              <AppText variant="small" tone="muted" weight="semibold">{t('app.scan.pickPhoto')}</AppText>
            </View>
          )}
        </Pressable>

        {/* Preview notice */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
          <SparkleIcon size={18} color={colors.primary} />
          <AppText variant="tiny" weight="semibold" style={{ color: colors.primary, flex: 1 }}>{t('app.scan.preview')}</AppText>
        </View>

        {/* AI analysis card */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <SparkleIcon size={18} color={colors.primary} />
              <AppText variant="body" weight="bold">{t('app.scan.analysisTitle')}</AppText>
            </View>
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.primarySoft }}>
              <AppText variant="tiny" weight="bold" style={{ color: colors.primary }}>{`${t('app.scan.confidence')}: 92%`}</AppText>
            </View>
          </View>

          {DEMO_ITEMS.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <AppText variant="small" weight="semibold">{item.name}</AppText>
                <AppText variant="tiny" tone="muted">{`${item.grams} g`}</AppText>
              </View>
              <AppText variant="small" weight="bold">{`${item.kcal} kcal`}</AppText>
            </View>
          ))}

          {/* Total */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1.5, borderTopColor: colors.borderStrong }}>
            <AppText variant="body" weight="heavy">{t('app.scan.total')}</AppText>
            <AppText style={{ fontSize: fontSize.h3, fontWeight: fontWeight.heavy, color: colors.primary }}>{`${DEMO_TOTAL.kcal} kcal`}</AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
            <MacroTag label={t('app.scan.protein')} value={`${DEMO_TOTAL.protein} g`} color={colors.protein} />
            <MacroTag label={t('app.scan.carbs')} value={`${DEMO_TOTAL.carbs} g`} color={colors.carbs} />
            <MacroTag label={t('app.scan.fat')} value={`${DEMO_TOTAL.fat} g`} color={colors.fat} />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button title={t('app.scan.adjust')} variant="secondary" onPress={() => {}} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={saved ? '✓' : t('app.scan.save')}
              variant="primary"
              onPress={() => { setSaved(true); setTimeout(() => router.back(), 400); }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroTag({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="tiny" tone="muted" weight="semibold">{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <AppText variant="small" weight="bold">{value}</AppText>
      </View>
    </View>
  );
}
