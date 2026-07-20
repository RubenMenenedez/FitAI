import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

// Neon Auth (Better Auth) instance backing this project. Not a secret --
// hardcoding as a fallback is fine, but allow overriding via env for
// different environments (e.g. a future staging project).
const AUTH_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ??
  'https://ep-restless-lake-aud1t6oy.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'fitai',
      storagePrefix: 'fitai',
      storage: SecureStore,
    }),
    // Registers the /token endpoint's client-side typing so
    // authClient.token() resolves to a JWT (used as the Bearer token
    // against our own backend's requireAuth/JWKS check), matching the
    // "jwt" server plugin already enabled on this Neon Auth project.
    jwtClient(),
  ],
});
