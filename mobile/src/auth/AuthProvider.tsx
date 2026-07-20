import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authClient } from './authClient';
import { setAuthToken } from '../api/client';

export interface AuthResult {
  error: string | null;
}

type Session = ReturnType<typeof authClient.useSession>['data'];

interface AuthContextValue {
  session: Session;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [isSyncingToken, setIsSyncingToken] = useState(false);

  // Whenever the Better Auth session becomes active/inactive, exchange it
  // for (or clear) the JWT our own backend's requireAuth middleware expects
  // on api/client.ts's apiClient.
  useEffect(() => {
    let cancelled = false;

    async function syncToken() {
      if (!session) {
        setAuthToken(null);
        return;
      }
      setIsSyncingToken(true);
      try {
        const { data, error } = await authClient.token();
        if (cancelled) return;
        setAuthToken(error ? null : (data?.token ?? null));
      } finally {
        if (!cancelled) setIsSyncingToken(false);
      }
    }

    syncToken();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await authClient.signIn.email({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: name && name.length > 0 ? name : email,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await authClient.signOut();
    setAuthToken(null);
  }

  const value: AuthContextValue = {
    session,
    // isPending: Better Auth hasn't determined session state yet.
    // isSyncingToken: session is known but we're still exchanging it for a
    // backend JWT -- callers that gate API calls on isLoading avoid firing
    // requests before setAuthToken has run.
    isLoading: isPending || isSyncingToken,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
