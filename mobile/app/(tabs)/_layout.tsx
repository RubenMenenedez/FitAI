import { Tabs } from 'expo-router/js-tabs';
import { colors } from '../../src/theme';

export default function TabsLayout() {
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
      <Tabs.Screen name="dashboard" options={{ title: 'Hoy', tabBarLabel: 'Hoy' }} />
      <Tabs.Screen name="planner" options={{ title: 'Plan', tabBarLabel: 'Plan' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progreso', tabBarLabel: 'Progreso' }} />
      <Tabs.Screen name="goals" options={{ title: 'Objetivos', tabBarLabel: 'Objetivos' }} />
      <Tabs.Screen name="groups" options={{ title: 'Grupos', tabBarLabel: 'Grupos' }} />
      <Tabs.Screen name="progress-photos" options={{ title: 'Fotos', tabBarLabel: 'Fotos' }} />
      <Tabs.Screen name="shopping-list" options={{ href: null }} />
    </Tabs>
  );
}
