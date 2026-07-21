import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { generateWeeklyPlan } from './mealPlans.service';

export const mealPlansRouter = Router();

mealPlansRouter.post('/generate', requireAuth, async (req, res) => {
  const parsed = z.object({ weekStartDate: z.string().date() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const plan = await generateWeeklyPlan(req.userId!, parsed.data.weekStartDate);
  res.status(201).json(plan);
});
