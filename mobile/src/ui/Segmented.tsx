import { View, Pressable } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './Typography';

// iOS-style segmented control (pill track, sliding selection). Used for
// time-range filters and small mutually-exclusive choices.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              alignItems: 'center',
              backgroundColor: active ? colors.surface : 'transparent',
              ...(active
                ? {
                    shadowColor: '#0B0B0F',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 3,
                    elevation: 1,
                  }
                : null),
            }}
          >
            <AppText variant="small" weight="semibold" tone={active ? 'default' : 'muted'}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
