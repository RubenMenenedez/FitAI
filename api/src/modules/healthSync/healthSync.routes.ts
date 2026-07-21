import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { ingestHealthSamples } from './healthSync.service';

export const healthSyncRouter = Router();

const sampleSchema = z.object({ type: z.literal('weight'), valueKg: z.number().positive(), recordedAt: z.string().datetime() });

healthSyncRouter.post('/samples', requireAuth, async (req, res) => {
  const parsed = z.object({ samples: z.array(sampleSchema) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await ingestHealthSamples(req.userId!, parsed.data.samples));
});
