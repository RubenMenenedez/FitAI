import { Stack } from 'expo-router';

// Nests the onboarding steps (personal-data, activity-goal, meals-per-day)
// under a single `(onboarding)` navigator so the root layout can guard the
// whole group with a single <Stack.Protected>.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
