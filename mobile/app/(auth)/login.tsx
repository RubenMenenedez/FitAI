import { useState } from 'react';
import { Link, router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../../src/auth/AuthProvider';
import { Screen, Field, Button, AppText, spacing } from '../../src/ui';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn(email.trim(), password);
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

  return (
    <Screen
      title="Iniciar sesión"
      subtitle="Bienvenido de nuevo"
      keyboard
      scroll
    >
      {error ? (
        <AppText tone="danger" style={{ marginBottom: spacing.md }}>
          {error}
        </AppText>
      ) : null}

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
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Entrar"
        onPress={handleSubmit}
        loading={isSubmitting}
        fullWidth
      />

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Link href="/(auth)/signup">
          <AppText tone="primary">¿No tienes cuenta? Regístrate</AppText>
        </Link>
      </View>
    </Screen>
  );
}
