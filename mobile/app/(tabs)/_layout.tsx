import { Tabs } from 'expo-router/js-tabs';
import { FitTabBar } from '../../src/ui/TabBar';
import { useT } from '../../src/i18n';

export default function TabsLayout() {
  const t = useT();

  // Route name → localized label for the custom bar.
  const labels: Record<string, string> = {
    dashboard: t('tabs.nav.home'),
    planner: t('tabs.nav.plan'),
    progress: t('tabs.nav.progress'),
    profile: t('tabs.nav.profile'),
  };

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FitTabBar {...props} labels={labels} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="planner" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />

      {/* Secondary destinations — reachable from within screens, not the bar. */}
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="progress-photos" options={{ href: null }} />
      <Tabs.Screen name="shopping-list" options={{ href: null }} />
      <Tabs.Screen name="paywall" options={{ href: null }} />
    </Tabs>
  );
}
