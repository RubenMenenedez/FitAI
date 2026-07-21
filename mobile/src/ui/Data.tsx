import { View, type ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../theme';
import { AppText } from './Typography';
import { Card } from './Card';

// Big highlighted number (e.g. calorie target). Optional unit + label.
export function Stat({
  value,
  unit,
  label,
  tone = 'primary',
}: {
  value: string | number;
  unit?: string;
  label: string;
  tone?: 'primary' | 'success' | 'default';
}) {
  const color = tone === 'primary' ? colors.primary : tone === 'success' ? colors.successDark : colors.text;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <AppText style={{ fontSize: fontSize.display, fontWeight: fontWeight.heavy, color }}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="small" tone="muted" weight="semibold">
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="small" tone="muted" weight="medium">
        {label}
      </AppText>
    </View>
  );
}

// Labelled horizontal progress bar (macros, goal progress).
export function ProgressBar({
  label,
  value,
  max,
  color = colors.primary,
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  valueLabel?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <AppText variant="small" weight="semibold" tone="muted">
          {label}
        </AppText>
        <AppText variant="small" weight="semibold">
          {valueLabel ?? `${Math.round(value)} / ${Math.round(max)}`}
        </AppText>
      </View>
      <View
        style={{
          height: 10,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: radius.pill }} />
      </View>
    </View>
  );
}

// Centered empty placeholder for lists with no data yet.
export function EmptyState({
  title,
  message,
  style,
}: {
  title: string;
  message?: string;
  style?: ViewStyle;
}) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl, ...style }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.pill,
          backgroundColor: colors.primarySoft,
          marginBottom: spacing.md,
        }}
      />
      <AppText variant="h3" weight="bold" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" tone="muted" center style={{ marginTop: spacing.xs, maxWidth: 260 }}>
          {message}
        </AppText>
      ) : null}
    </Card>
  );
}
