import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { useOnboardingStatus } from '../src/hooks/useOnboardingStatus';

const queryClient = new QueryClient();

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

function RootNavigation() {
  const { session, isLoading: authLoading } = useAuth();
  // Self-gated on auth readiness (see useOnboardingStatus): stays idle for
  // unauthenticated users and only fires once apiClient has a valid token.
  const { isResolving, hasCompletedOnboarding } = useOnboardingStatus();

  // Hold on a spinner until auth is settled and -- for a logged-in user --
  // their onboarding status has resolved. Flipping the guards below on
  // half-known state is what would flash the wrong screen or thrash the
  // navigator; gating here keeps every guard derived from settled values.
  if (authLoading || (session && isResolving)) {
    return <Loading />;
  }

  const isAuthed = !!session;
  const needsOnboarding = isAuthed && !hasCompletedOnboarding;
  const isOnboarded = isAuthed && hasCompletedOnboarding;

  // Declarative route guards (expo-router's documented pattern for SDK 53+):
  // at most one group is accessible for a given auth/onboarding state, and
  // expo-router moves the user into the accessible group itself -- no
  // render-time <Redirect> chains, which are what caused the navigation
  // "maximum update depth exceeded" loop.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </QueryClientProvider>
  );
}
