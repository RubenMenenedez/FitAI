import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { AppText } from './Typography';

/**
 * Fit AI brand lockup — a rounded blue tile with a lightning bolt, followed by
 * the "Fit AI" wordmark. Used on the welcome screen, dashboard header and paywall.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  const inner = size * 0.56;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={inner} height={inner} viewBox="0 0 24 24">
        <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={colors.white} />
      </Svg>
    </View>
  );
}

export function BrandLogo({
  size = 32,
  color = colors.text,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <BrandMark size={size} />
      <AppText
        style={{
          fontSize: size * 0.72,
          fontWeight: fontWeight.heavy,
          color,
          letterSpacing: -0.5,
        }}
      >
        Fit AI
      </AppText>
    </View>
  );
}
