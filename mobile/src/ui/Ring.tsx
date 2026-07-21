import { type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { AppText } from './Typography';

export interface RingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  center?: ReactNode;
}

// Circular progress ring (SVG). Starts at 12 o'clock, fills clockwise.
export function Ring({
  size = 120,
  strokeWidth = 12,
  progress,
  color = colors.ink,
  trackColor = colors.surfaceAlt,
  center,
}: RingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          // rotate so progress starts at the top
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {center}
    </View>
  );
}

// Labelled macro ring (small): a colored ring with a value + label underneath.
export function MacroRing({
  label,
  value,
  max,
  color,
  unit = 'g',
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  const progress = max > 0 ? value / max : 0;
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }}>
      <Ring
        size={64}
        strokeWidth={7}
        progress={progress}
        color={color}
        center={
          <AppText style={{ fontSize: fontSize.small, fontWeight: fontWeight.bold }}>
            {Math.round(value)}
            {unit}
          </AppText>
        }
      />
      <AppText variant="tiny" tone="muted" weight="semibold">
        {label}
      </AppText>
    </View>
  );
}
