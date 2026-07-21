import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, shadow } from '../theme';
import { AppText } from './Typography';
import { HomeIcon, CalendarIcon, ChartIcon, UserIcon, CameraIcon } from './icons';

// The four primary destinations, in bar order. The camera FAB sits between the
// second and third and routes to the (modal) scan screen instead of a tab.
const PRIMARY: Array<{
  name: string;
  labelKey: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactNode;
}> = [
  { name: 'dashboard', labelKey: 'Inicio',   Icon: HomeIcon },
  { name: 'planner',   labelKey: 'Plan',     Icon: CalendarIcon },
  { name: 'progress',  labelKey: 'Progreso', Icon: ChartIcon },
  { name: 'profile',   labelKey: 'Perfil',   Icon: UserIcon },
];

// Minimal shape of the props expo-router's <Tabs tabBar> passes (a subset of
// React Navigation's BottomTabBarProps — only what this bar reads/calls).
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
}

/**
 * Custom bottom tab bar matching the Fit AI mockup: four labelled icon tabs with
 * a raised circular camera FAB floating in the center. `labels` maps route name
 * → localized label so the bar stays i18n-driven.
 */
export function FitTabBar({ state, navigation, labels }: TabBarProps & { labels: Record<string, string> }) {
  const insets = useSafeAreaInsets();

  function isFocused(name: string) {
    const route = state.routes[state.index];
    return route?.name === name;
  }

  function go(name: string) {
    const focused = isFocused(name);
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(name);
  }

  const left = PRIMARY.slice(0, 2);
  const right = PRIMARY.slice(2);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
        paddingBottom: Math.max(insets.bottom, spacing.sm),
        paddingHorizontal: spacing.sm,
      }}
    >
      {left.map((tab) => (
        <TabItem key={tab.name} tab={tab} label={labels[tab.name]} focused={isFocused(tab.name)} onPress={() => go(tab.name)} />
      ))}

      {/* Center camera FAB */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear comida"
          onPress={() => router.push('/scan')}
          style={({ pressed }) => [
            {
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -18,
              borderWidth: 4,
              borderColor: colors.surface,
            },
            shadow.card,
          ]}
        >
          <CameraIcon size={26} color={colors.white} />
        </Pressable>
      </View>

      {right.map((tab) => (
        <TabItem key={tab.name} tab={tab} label={labels[tab.name]} focused={isFocused(tab.name)} onPress={() => go(tab.name)} />
      ))}
    </View>
  );
}

function TabItem({
  tab,
  label,
  focused,
  onPress,
}: {
  tab: { name: string; Icon: (p: { size?: number; color?: string }) => React.ReactNode };
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const color = focused ? colors.primary : colors.textFaint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2 }}
    >
      {tab.Icon({ size: 24, color })}
      <AppText style={{ fontSize: 11, fontWeight: '600', color }}>{label}</AppText>
    </Pressable>
  );
}
