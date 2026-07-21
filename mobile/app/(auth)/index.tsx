import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  AppText,
  Button,
  BrandLogo,
  BrandMark,
  CameraIcon,
  SparkleIcon,
  colors,
  spacing,
  radius,
} from '../../src/ui';
import { useT, LanguageToggle } from '../../src/i18n';

/**
 * Welcome / landing screen — the first thing an unauthenticated user sees.
 * Big headline over a hero, "Comenzar" → signup, and a login link.
 */
export default function WelcomeScreen() {
  const t = useT();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl }}>
        {/* Top bar: brand + language */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandLogo size={28} />
          <LanguageToggle />
        </View>

        {/* Hero */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
          <View
            style={{
              width: 180,
              height: 180,
              borderRadius: radius.xl,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BrandMark size={84} />
            <View style={{ position: 'absolute', bottom: -14, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border }}>
              <CameraIcon size={16} color={colors.primary} />
              <AppText variant="tiny" weight="bold" style={{ color: colors.primary }}>AI</AppText>
              <SparkleIcon size={14} color={colors.primary} />
            </View>
          </View>

          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <AppText variant="h1" weight="heavy" center style={{ maxWidth: 320 }}>
              {t('app.welcome.headline')}
            </AppText>
            <AppText variant="body" tone="muted" center style={{ maxWidth: 300 }}>
              {t('app.welcome.sub')}
            </AppText>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          <Button title={t('app.welcome.start')} variant="primary" onPress={() => router.push('/(auth)/signup')} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm }}
          >
            <AppText variant="small" tone="muted">{t('app.welcome.haveAccount')}</AppText>
            <AppText variant="small" weight="bold" style={{ color: colors.primary }}>{t('app.welcome.login')}</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
