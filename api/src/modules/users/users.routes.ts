import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../auth/requireAuth';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { completeOnboarding } from './users.service';

const onboardingSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: z.string().date().refine((d) => new Date(d) <= new Date(), 'birthDate must be in the past'),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']),
  mealsPerDay: z.enum(['3', '5_6']),
  dietMode: z.enum(['standard', 'keto', 'high_protein', 'vegetarian_vegan']).default('standard'),
});

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  res.json(user);
});

usersRouter.post('/onboarding', requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await completeOnboarding(req.userId!, parsed.data);
  res.status(200).json(user);
});
