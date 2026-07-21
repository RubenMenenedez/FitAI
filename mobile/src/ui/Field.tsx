import { useState } from 'react';
import { View, TextInput, type TextInputProps } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';
import { AppText } from './Typography';

export interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Field({ label, error, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? (
        <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.sm }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            height: 52,
            borderWidth: 1.5,
            borderColor,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            fontSize: fontSize.body,
            color: colors.text,
            backgroundColor: colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="small" tone="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
