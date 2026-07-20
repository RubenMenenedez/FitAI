import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { completeOnboarding } from './users.service';

const onboardingSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: z.string().date(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']),
  mealsPerDay: z.enum(['3', '5_6']),
});

export const usersRouter = Router();

usersRouter.post('/onboarding', requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await completeOnboarding(req.userId!, parsed.data);
  res.status(200).json(user);
});
