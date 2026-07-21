import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth';
import { logActivityForStreak, restoreStreak } from './streaks.service';

export const streaksRouter = Router();

streaksRouter.post('/log', requireAuth, async (req, res) => {
  res.json(await logActivityForStreak(req.userId!));
});

streaksRouter.post('/restore', requireAuth, async (req, res) => {
  try {
    res.json(await restoreStreak(req.userId!));
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { code?: string }).code === 'PREMIUM_REQUIRED') {
      res.status(402).json({ error: 'premium required to restore streak' });
      return;
    }
    res.status(400).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});
