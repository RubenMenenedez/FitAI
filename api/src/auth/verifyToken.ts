import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: undefined, // Neon Auth (Stack Auth) firma sin issuer fijo por proyecto; validar solo firma+exp
  });
  return payload as { sub: string; email?: string };
}
