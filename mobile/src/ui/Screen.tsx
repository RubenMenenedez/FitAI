import { type ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { AppText, Heading } from './Typography';

export interface ScreenProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  keyboard?: boolean;
  contentStyle?: ViewStyle;
  edges?: readonly Edge[];
  headerRight?: ReactNode;
}

export function Screen({
  children,
  title,
  subtitle,
  scroll = false,
  keyboard = false,
  contentStyle,
  edges = ['top', 'left', 'right'],
  headerRight,
}: ScreenProps) {
  const header =
    title || subtitle ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          {title ? <Heading variant="h1">{title}</Heading> : null}
          {subtitle ? (
            <AppText variant="body" tone="muted" style={{ marginTop: spacing.xs }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {headerRight ? <View style={{ marginLeft: spacing.md }}>{headerRight}</View> : null}
      </View>
    ) : null;

  const padding: ViewStyle = { padding: spacing.xl, paddingBottom: spacing.xxxl };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padding, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padding, contentStyle]}>
      {header}
      {children}
    </View>
  );

  const inner = keyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}
