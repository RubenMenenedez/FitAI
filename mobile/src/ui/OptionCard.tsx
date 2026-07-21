import { Pressable, View } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './Typography';
import { CheckIcon } from './icons';

/**
 * Full-width selectable card: leading icon tile, title (+ optional description),
 * and a trailing radio/check that fills in when selected. Used for the sex and
 * goal onboarding steps (Cal AI–style list options).
 */
export function OptionCard({
  label,
  description,
  icon,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {icon ? (
        <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: selected ? colors.surface : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="bold">{label}</AppText>
        {description ? (
          <AppText variant="small" tone="muted" style={{ marginTop: 2 }}>{description}</AppText>
        ) : null}
      </View>
      <View
        style={{
          width: 24, height: 24, borderRadius: 12,
          borderWidth: selected ? 0 : 2,
          borderColor: colors.borderStrong,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {selected ? <CheckIcon size={16} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}
