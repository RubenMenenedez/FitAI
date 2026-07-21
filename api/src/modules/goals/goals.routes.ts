import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createGoal, listGoalsWithProjection } from './goals.service';

export const goalsRouter = Router();

const createGoalSchema = z.object({
  goalType: z.enum(['target_weight', 'daily_calories', 'daily_protein', 'weekly_workouts', 'water_intake', 'custom']),
  targetValue: z.number(),
  targetDate: z.string().date().optional(),
});

goalsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { goalType, targetValue, targetDate } = parsed.data;
  const input: import('./goals.service').CreateGoalInput = {
    goalType,
    targetValue,
    ...(targetDate !== undefined ? { targetDate } : {}),
  };
  res.status(201).json(await createGoal(req.userId!, input));
});

goalsRouter.get('/', requireAuth, async (req, res) => {
  res.json(await listGoalsWithProjection(req.userId!));
});
