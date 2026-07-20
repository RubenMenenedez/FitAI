import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

interface MeResponse {
  id: string;
  email: string;
  // NULL until onboarding completes; a numeric string once it has.
  dailyCalorieTarget: string | null;
  [key: string]: unknown;
}

export const ME_QUERY_KEY = ['users', 'me'] as const;

/**
 * Fetches the authenticated user's profile to determine whether they've
 * finished onboarding. Only fires once AuthProvider reports auth is ready
 * (isLoading === false && a session exists) so apiClient already has a valid
 * Bearer token and the request can't 401 on a missing header.
 */
export function useOnboardingStatus() {
  const { session, isLoading: authLoading } = useAuth();
  const enabled = !authLoading && !!session;

  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>('/users/me');
      return data;
    },
  });

  // While auth is still settling, or the query hasn't produced data yet, we
  // don't know the onboarding state -- callers must keep waiting rather than
  // guess (avoids flashing the wrong screen / redirect loops).
  const isResolving = !enabled || query.isPending;

  return {
    isResolving,
    hasCompletedOnboarding: query.data?.dailyCalorieTarget != null,
    isError: query.isError,
    query,
  };
}
