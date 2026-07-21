import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user || user.subscriptionStatus === 'free') {
    res.status(402).json({ error: 'premium subscription required' });
    return;
  }
  next();
}
