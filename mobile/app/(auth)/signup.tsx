import { useState } from 'react';
import { Link, router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../../src/auth/AuthProvider';
import { Screen, Field, Button, AppText, GoogleLogo, colors, spacing } from '../../src/ui';

export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace('/');
    } catch {
      // A network-level failure (no connectivity, DNS, timeout, ...) throws
      // instead of resolving to { error }, unlike Better Auth's own
      // application errors.
      setError('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace('/');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Screen
      title="Crear cuenta"
      subtitle="Empieza tu experiencia FitAI"
      keyboard
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <Field
        label="Nombre"
        placeholder="Nombre"
        autoCapitalize="words"
        autoComplete="name"
        value={name}
        onChangeText={setName}
      />
      <Field
        label="Email"
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Contraseña"
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Crear cuenta"
        onPress={handleSubmit}
        loading={isSubmitting}
        fullWidth
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <AppText variant="small" tone="faint" weight="semibold">o</AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <Button
        title="Continuar con Google"
        variant="secondary"
        onPress={handleGoogle}
        loading={isGoogleLoading}
        leftIcon={<GoogleLogo size={20} />}
        fullWidth
      />

      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <Link href="/(auth)/login">
          <AppText tone="primary">¿Ya tienes cuenta? Inicia sesión</AppText>
        </Link>
      </View>
    </Screen>
  );
}
