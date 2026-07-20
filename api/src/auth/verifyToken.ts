import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    // Neon Auth (Stack Auth) firma sin issuer fijo por proyecto; no se valida iss.
  });
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('token payload missing sub claim');
  }
  return payload as { sub: string; email?: string };
}
