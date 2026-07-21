import { Stack } from 'expo-router';

// Nests the auth screens (login, signup) under a single `(auth)` navigator so
// the root layout can guard the whole group with a single <Stack.Protected>.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
