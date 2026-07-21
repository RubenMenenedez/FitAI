import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fontSize, fontWeight } from '../theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny';
type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'success' | 'danger' | 'inverse';

const VARIANT_STYLE: Record<Variant, TextStyle> = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.heavy, letterSpacing: -0.5 },
  h1: { fontSize: fontSize.h1, fontWeight: fontWeight.bold, letterSpacing: -0.4 },
  h2: { fontSize: fontSize.h2, fontWeight: fontWeight.bold, letterSpacing: -0.2 },
  h3: { fontSize: fontSize.h3, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.body, fontWeight: fontWeight.regular, lineHeight: fontSize.body * 1.5 },
  small: { fontSize: fontSize.small, fontWeight: fontWeight.medium },
  tiny: { fontSize: fontSize.tiny, fontWeight: fontWeight.semibold },
};

const TONE_COLOR: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  primary: colors.primary,
  success: colors.successDark,
  danger: colors.danger,
  inverse: colors.white,
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof fontWeight;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'default', weight, center, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[
        VARIANT_STYLE[variant],
        { color: TONE_COLOR[tone] },
        weight ? { fontWeight: fontWeight[weight] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}

export function Heading({ variant = 'h1', ...rest }: AppTextProps) {
  return <AppText variant={variant} {...rest} />;
}
