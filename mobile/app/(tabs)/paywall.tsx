import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Screen,
  AppText,
  Button,
  Card,
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../src/ui';
import { useT } from '../../src/i18n';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPremium,
} from '../../src/purchases/purchasesClient';
import { REFERENCE_PRICES } from '../../src/purchases/plans';

// Feature bullet points displayed on the paywall.
const FEATURE_KEYS = [
  'tabs.paywall.feature1',
  'tabs.paywall.feature2',
  'tabs.paywall.feature3',
  'tabs.paywall.feature4',
] as const;

export default function PaywallScreen() {
  const t = useT();

  // RevenueCat packages (null = SDK not available / not loaded yet).
  const [monthlyPkg, setMonthlyPkg] = useState<any>(null);
  const [annualPkg, setAnnualPkg] = useState<any>(null);

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOfferings().then((offering) => {
      if (cancelled || !offering) return;
      // RevenueCat packages are available under offering.availablePackages.
      const pkgs: any[] = offering.availablePackages ?? [];
      for (const pkg of pkgs) {
        // Match by RevenueCat package type or product id. Products are named
        // "monthly" / "yearly" in the dashboard.
        const id: string = `${pkg.packageType ?? ''} ${pkg.product?.productIdentifier ?? pkg.identifier ?? ''}`.toLowerCase();
        if (id.includes('month')) setMonthlyPkg(pkg);
        if (id.includes('year') || id.includes('annual')) setAnnualPkg(pkg);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve the localized price string; fall back to REFERENCE_PRICES.
  function priceString(plan: 'monthly' | 'annual'): string {
    const pkg = plan === 'monthly' ? monthlyPkg : annualPkg;
    const localizedPrice: string | undefined = pkg?.product?.localizedPriceString;
    if (localizedPrice) return localizedPrice;
    return `$${REFERENCE_PRICES[plan].toFixed(2)}`;
  }

  async function handlePurchase() {
    const pkg = selectedPlan === 'monthly' ? monthlyPkg : annualPkg;
    setLoading(true);
    try {
      // If SDK is absent, purchasePackage throws 'purchases unavailable' — that's fine,
      // the catch below will surface it gracefully via Alert.
      const customerInfo = await purchasePackage(pkg);
      if (isPremium(customerInfo)) {
        router.replace('/(tabs)/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Treat user-cancelled as a silent no-op (no alert shown).
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('usercancel')) {
        // no-op
      } else {
        Alert.alert(t('tabs.paywall.errorGeneric'), msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && isPremium(customerInfo)) {
        Alert.alert(t('tabs.paywall.restoreSuccess'), undefined, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') },
        ]);
      } else {
        Alert.alert(t('tabs.paywall.restoreNone'));
      }
    } catch {
      Alert.alert(t('tabs.paywall.errorGeneric'));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Screen title={t('tabs.paywall.title')} subtitle={t('tabs.paywall.subtitle')} scroll>
      {/* Feature list */}
      <Card style={{ marginBottom: spacing.lg }}>
        {FEATURE_KEYS.map((key) => (
          <View
            key={key}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <AppText style={{ color: colors.success, fontSize: fontSize.body, marginRight: spacing.sm }}>
              ✓
            </AppText>
            <AppText variant="body">{t(key)}</AppText>
          </View>
        ))}
      </Card>

      {/* Plan cards */}
      <Card
        onPress={() => setSelectedPlan('monthly')}
        style={{
          marginBottom: spacing.md,
          borderWidth: selectedPlan === 'monthly' ? 2 : 1,
          borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText style={{ fontSize: fontSize.h3, fontWeight: fontWeight.bold, color: colors.text }}>
              {t('tabs.paywall.planMonthlyLabel')}
            </AppText>
            <AppText variant="small" tone="muted">
              {priceString('monthly')} {t('tabs.paywall.perMonth')}
            </AppText>
          </View>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: selectedPlan === 'monthly' ? colors.primary : colors.borderStrong,
              backgroundColor: selectedPlan === 'monthly' ? colors.primary : 'transparent',
            }}
          />
        </View>
      </Card>

      <Card
        onPress={() => setSelectedPlan('annual')}
        style={{
          marginBottom: spacing.xl,
          borderWidth: selectedPlan === 'annual' ? 2 : 1,
          borderColor: selectedPlan === 'annual' ? colors.primary : colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <AppText style={{ fontSize: fontSize.h3, fontWeight: fontWeight.bold, color: colors.text }}>
                {t('tabs.paywall.planAnnualLabel')}
              </AppText>
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                }}
              >
                <AppText style={{ color: colors.white, fontSize: fontSize.tiny, fontWeight: fontWeight.bold }}>
                  {t('tabs.paywall.planAnnualBadge')}
                </AppText>
              </View>
            </View>
            <AppText variant="small" tone="muted">
              {priceString('annual')} {t('tabs.paywall.perYear')}
            </AppText>
          </View>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: selectedPlan === 'annual' ? colors.primary : colors.borderStrong,
              backgroundColor: selectedPlan === 'annual' ? colors.primary : 'transparent',
            }}
          />
        </View>
      </Card>

      {/* CTA */}
      <Button
        title={t('tabs.paywall.cta')}
        variant="primary"
        loading={loading}
        onPress={handlePurchase}
        style={{ marginBottom: spacing.md }}
      />

      {/* Restore (required by Apple) */}
      <Button
        title={t('tabs.paywall.restore')}
        variant="ghost"
        loading={restoring}
        onPress={handleRestore}
      />
    </Screen>
  );
}
