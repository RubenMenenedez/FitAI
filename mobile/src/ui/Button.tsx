import { Pressable, ActivityIndicator, View, type PressableProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, shadow } from '../theme';
import { AppText } from './Typography';

type Variant = 'primary' | 'success' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: colors.ink,
  success: colors.success,
  secondary: colors.surface,
  ghost: 'transparent',
  danger: colors.danger,
};

const BG_PRESSED: Record<Variant, string> = {
  primary: colors.inkPressed,
  success: colors.successDark,
  secondary: colors.surfaceAlt,
  ghost: colors.surfaceAlt,
  danger: '#DC2626',
};

const LABEL: Record<Variant, string> = {
  primary: colors.white,
  success: colors.white,
  secondary: colors.text,
  ghost: colors.text,
  danger: colors.white,
};

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'lg' ? 56 : 48;
  const isSolid = variant === 'primary' || variant === 'success' || variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: pressed ? BG_PRESSED[variant] : BG[variant],
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: colors.borderStrong,
          opacity: isDisabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isSolid ? shadow.soft : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={LABEL[variant]} size="small" />
      ) : (
        <AppText style={{ color: LABEL[variant], fontSize: fontSize.body, fontWeight: fontWeight.bold }}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

// Pill chip for toggles / emoji reactions / filters. Active = ink outline + fill.
export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.ink : colors.surfaceAlt,
        borderWidth: 1.5,
        borderColor: active ? colors.ink : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View>
        <AppText variant="small" weight="semibold" style={{ color: active ? colors.white : colors.textMuted }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
