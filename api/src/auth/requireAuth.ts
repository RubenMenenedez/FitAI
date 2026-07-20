import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './verifyToken';
import { db } from '../db/client';
import { users } from '../db/schema';

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }

  let payload: { sub: string; email?: string };
  try {
    payload = await verifyToken(header.slice('Bearer '.length));
  } catch {
    res.status(401).json({ error: 'invalid token' });
    return;
  }

  // Neon Auth JWTs are documented to include an `email` claim, but the type
  // from verifyToken keeps it optional since that isn't enforced by the JWT
  // library itself. `users.email` is NOT NULL UNIQUE, so we fail closed
  // instead of inventing a placeholder value that could misrepresent a
  // real user's identity.
  if (!payload.email) {
    res.status(401).json({ error: 'token missing required email claim' });
    return;
  }

  // `neon_auth.users_sync` is Neon Auth's own internal table; nothing else
  // copies signups into our `public.users` table. Provision it here, on the
  // first authenticated request, so every route behind requireAuth can rely
  // on a `users` row already existing (see users.id comment in schema.ts).
  await db.insert(users)
    .values({ id: payload.sub, email: payload.email })
    .onConflictDoNothing({ target: users.id });

  req.userId = payload.sub;
  next();
}
