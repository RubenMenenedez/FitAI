import { useState } from 'react';
import { Link, router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../../src/auth/AuthProvider';
import { Screen, Field, Button, AppText, spacing } from '../../src/ui';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Link href="/(auth)/login">
          <AppText tone="primary">¿Ya tienes cuenta? Inicia sesión</AppText>
        </Link>
      </View>
    </Screen>
  );
}
