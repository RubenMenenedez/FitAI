import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './verifyToken';

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
  try {
    const payload = await verifyToken(header.slice('Bearer '.length));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
