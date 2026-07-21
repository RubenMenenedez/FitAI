import { View, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './Typography';

export interface PaceStop {
  value: number;
  label: string;
  emoji: string;
}

/**
 * Three-stop pace selector (Lento / Recomendado / Rápido). Each stop shows an
 * animal emoji + label; a track with a thumb snaps to the chosen stop. Tapping a
 * stop or the track segment selects it.
 */
export function PaceSlider({
  stops,
  value,
  onChange,
  tint = colors.primary,
}: {
  stops: PaceStop[];
  value: number;
  onChange: (v: number) => void;
  tint?: string;
}) {
  const index = Math.max(0, stops.findIndex((s) => s.value === value));
  const activeIndex = index === -1 ? 1 : index;

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Labels */}
      <View style={{ flexDirection: 'row' }}>
        {stops.map((s, i) => {
          const active = i === activeIndex;
          return (
            <Pressable key={s.value} onPress={() => onChange(s.value)} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <AppText style={{ fontSize: 30, opacity: active ? 1 : 0.4 }}>{s.emoji}</AppText>
              <AppText variant="small" weight="bold" style={{ color: active ? tint : colors.textFaint }}>
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Track */}
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute', left: 0, height: 8, borderRadius: radius.pill, backgroundColor: tint,
            width: `${(activeIndex / (stops.length - 1)) * 100}%`,
          }}
        />
        {/* Thumb */}
        <View
          style={{
            position: 'absolute',
            left: `${(activeIndex / (stops.length - 1)) * 100}%`,
            marginLeft: -14,
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: colors.surface, borderWidth: 3, borderColor: tint,
          }}
        />
        {/* Tap targets */}
        <View style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row' }}>
          {stops.map((s) => (
            <Pressable key={s.value} onPress={() => onChange(s.value)} style={{ flex: 1, height: 28 }} />
          ))}
        </View>
      </View>
    </View>
  );
}
