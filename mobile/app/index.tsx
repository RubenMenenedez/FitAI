import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';

// Placeholder landing screen for authenticated users. A later task adds
// (onboarding) and (tabs) route groups and will replace what authenticated
// users land on.
export default function IndexScreen() {
  const { session, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    setError(null);
    signOut().catch(() => {
      setError('No se pudo cerrar sesión. Inténtalo de nuevo.');
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesión iniciada</Text>
      <Text style={styles.email}>{session?.user?.email}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    color: '#555',
  },
  error: {
    color: '#c0392b',
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
