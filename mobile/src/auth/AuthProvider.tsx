import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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
  /**
   * Google OAuth sign-in. The @better-auth/expo client intercepts this call and
   * opens the system browser (expo-web-browser) for the OAuth flow, then stores
   * the resulting session cookie. On success the session signal updates and the
   * root navigator moves the user past the auth gate — no manual navigation
   * required. Requires the Google provider to be enabled on the Neon Auth
   * project and `fitai://` in its trusted origins.
   */
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /**
   * Re-attempts exchanging the current Better Auth session for a backend
   * JWT. The initial exchange (see the effect below) fails closed with no
   * retry, so a transient network blip can leave apiClient without an
   * Authorization header even though the underlying Better Auth session is
   * still valid. Call this to recover -- e.g. once from an axios response
   * interceptor on a 401 before giving up. It is also called automatically
   * whenever the app returns to the foreground while a session is active.
   */
  resyncToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  // A session's own token (distinct from the JWT we exchange it for) is
  // stable for the lifetime of that session and changes on every new
  // sign-in, so it's a reliable key for "which session have we synced".
  const sessionKey = session?.session?.token ?? null;

  // The key of the session we've actually finished calling setAuthToken()
  // for (successfully or not -- see syncToken below). Compared against
  // sessionKey at render time on every render, not just after the effect
  // runs, so there is no window where a stale flag and a fresh session can
  // both be true at once: the moment sessionKey changes, this comparison
  // goes false on that same render, synchronously, before the gate in
  // _layout.tsx ever sees it.
  const [syncedSessionKey, setSyncedSessionKey] = useState<string | null>(null);

  // Effects only see the value of sessionKey from the render that scheduled
  // them; syncToken is also invoked from the AppState listener and from
  // resyncToken() outside of that render cycle, so it reads the latest
  // session key from a ref instead of closing over a possibly-stale one.
  const sessionKeyRef = useRef(sessionKey);
  sessionKeyRef.current = sessionKey;

  const syncToken = useCallback(async () => {
    const key = sessionKeyRef.current;
    if (!key) {
      setAuthToken(null);
      setSyncedSessionKey(null);
      return;
    }
    const { data, error } = await authClient.token();
    // The session may have moved on (signed out, signed into a different
    // account) while this request was in flight -- don't let a late
    // response clobber a newer one.
    if (sessionKeyRef.current !== key) return;
    setAuthToken(error ? null : (data?.token ?? null));
    setSyncedSessionKey(key);
  }, []);

  // Whenever the Better Auth session becomes active/inactive, exchange it
  // for (or clear) the JWT our own backend's requireAuth middleware expects
  // on api/client.ts's apiClient.
  useEffect(() => {
    syncToken();
  }, [sessionKey, syncToken]);

  // Recover from a transient failure automatically: retry the exchange
  // whenever the app comes back to the foreground and a session is active,
  // since the underlying Better Auth session may still be valid even
  // though our last JWT exchange attempt didn't complete.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && sessionKeyRef.current) {
        syncToken();
      }
    });
    return () => subscription.remove();
  }, [syncToken]);

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

  async function signInWithGoogle(): Promise<AuthResult> {
    try {
      // callbackURL is the deep link the OAuth browser session returns to; the
      // expo plugin resolves it against the `fitai` scheme. The plugin awaits
      // the browser flow, so this resolves once the session cookie is stored.
      const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.' };
    }
  }

  async function signOut() {
    await authClient.signOut();
    setAuthToken(null);
  }

  const isTokenSynced = sessionKey === null || syncedSessionKey === sessionKey;

  const value: AuthContextValue = {
    session,
    // isPending: Better Auth hasn't determined session state yet.
    // !isTokenSynced: session is known but setAuthToken() hasn't actually
    // run for it yet -- callers that gate rendering/API calls on isLoading
    // never see authenticated content before apiClient has a token.
    isLoading: isPending || !isTokenSynced,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resyncToken: syncToken,
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
