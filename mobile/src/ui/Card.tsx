import { View, Pressable, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  accent?: boolean; // subtle orange left edge for emphasis
  style?: ViewStyle;
}

export function Card({ children, onPress, padded = true, accent = false, style, ...rest }: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    ...(accent ? { borderLeftWidth: 4, borderLeftColor: colors.primary } : null),
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.85 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
