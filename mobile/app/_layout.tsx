import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
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
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  // Hooks must run unconditionally; the query inside is self-gated on auth
  // readiness (see useOnboardingStatus), so it stays idle for unauthenticated
  // users and only fires once apiClient has a valid Bearer token.
  const { isResolving, hasCompletedOnboarding, isError } = useOnboardingStatus();

  if (isLoading) {
    return <Loading />;
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inOnboardingGroup = segments[0] === '(onboarding)';

  if (!session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session && inAuthGroup) {
    // Authenticated users never stay in the (auth) group; where they go next
    // (onboarding vs. landing) is decided on the next render by the block
    // below once they're out of it.
    return <Redirect href="/" />;
  }

  if (session && !inAuthGroup) {
    // Still fetching onboarding status: hold on a spinner rather than flash
    // the landing screen and then bounce into onboarding (or vice versa).
    if (isResolving) {
      return <Loading />;
    }

    // Fail open on a /users/me error: let the user reach whatever screen
    // they're on instead of trapping them in a redirect loop. A transient
    // error clears on the query's own retry/refetch.
    if (!isError) {
      if (!hasCompletedOnboarding && !inOnboardingGroup) {
        return <Redirect href="/(onboarding)/personal-data" />;
      }
      if (hasCompletedOnboarding && inOnboardingGroup) {
        return <Redirect href="/" />;
      }
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
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
