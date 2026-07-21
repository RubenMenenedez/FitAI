import { Tabs } from 'expo-router/js-tabs';
import { colors } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function TabsLayout() {
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('tabs.nav.today'), tabBarLabel: t('tabs.nav.today') }} />
      <Tabs.Screen name="planner" options={{ title: t('tabs.nav.plan'), tabBarLabel: t('tabs.nav.plan') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.nav.progress'), tabBarLabel: t('tabs.nav.progress') }} />
      <Tabs.Screen name="goals" options={{ title: t('tabs.nav.goals'), tabBarLabel: t('tabs.nav.goals') }} />
      <Tabs.Screen name="groups" options={{ title: t('tabs.nav.groups'), tabBarLabel: t('tabs.nav.groups') }} />
      <Tabs.Screen name="progress-photos" options={{ title: t('tabs.nav.photos'), tabBarLabel: t('tabs.nav.photos') }} />
      <Tabs.Screen name="shopping-list" options={{ href: null }} />
      <Tabs.Screen name="paywall" options={{ href: null }} />
    </Tabs>
  );
}
