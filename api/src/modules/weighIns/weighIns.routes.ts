import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { recordWeighIn, listWeighIns, MissingHeightError } from './weighIns.service';

export const weighInsRouter = Router();

weighInsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ weightKg: z.number().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const row = await recordWeighIn(req.userId!, parsed.data.weightKg);
    res.status(201).json(row);
  } catch (err) {
    if (err instanceof MissingHeightError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

weighInsRouter.get('/', requireAuth, async (req, res) => {
  res.json(await listWeighIns(req.userId!));
});
