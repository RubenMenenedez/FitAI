import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { colors } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size ?? 22} color={color} />
  );
}

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
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Hoy', tabBarLabel: 'Hoy', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="planner"
        options={{ title: 'Plan', tabBarLabel: 'Plan', tabBarIcon: tabIcon('calendar', 'calendar-outline') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progreso', tabBarLabel: 'Progreso', tabBarIcon: tabIcon('trending-up', 'trending-up-outline') }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Objetivos', tabBarLabel: 'Objetivos', tabBarIcon: tabIcon('flag', 'flag-outline') }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Grupos', tabBarLabel: 'Grupos', tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="progress-photos"
        options={{ title: 'Fotos', tabBarLabel: 'Fotos', tabBarIcon: tabIcon('images', 'images-outline') }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{ href: null }}
      />
    </Tabs>
  );
}
