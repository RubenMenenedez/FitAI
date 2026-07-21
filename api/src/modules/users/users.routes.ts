import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../auth/requireAuth';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { completeOnboarding, type OnboardingInput } from './users.service';

const onboardingSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: z.string().date().refine((d) => new Date(d) <= new Date(), 'birthDate must be in the past'),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']),
  mealsPerDay: z.enum(['3', '5_6']),
  dietMode: z.enum(['standard', 'keto', 'high_protein', 'vegetarian_vegan']).optional(),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  targetWeightKg: z.number().positive().optional(),
  weeklyRateKg: z.number().min(0.1).max(1.5).optional(),
  trainingDaysPerWeek: z.number().int().min(0).max(7).optional(),
  pregnancyStatus: z.enum(['none', 'pregnant', 'breastfeeding']).optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  sleepHours: z.number().min(0).max(14).optional(),
  stressLevel: z.enum(['low', 'medium', 'high']).optional(),
  waterIntakeMl: z.number().min(0).max(10000).optional(),
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

  const data = parsed.data;
  const onboardingInput: OnboardingInput = {
    sex: data.sex,
    birthDate: data.birthDate,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityLevel: data.activityLevel,
    goal: data.goal,
    mealsPerDay: data.mealsPerDay,
    ...(data.dietMode !== undefined ? { dietMode: data.dietMode } : {}),
    ...(data.bodyFatPercent !== undefined ? { bodyFatPercent: data.bodyFatPercent } : {}),
    ...(data.targetWeightKg !== undefined ? { targetWeightKg: data.targetWeightKg } : {}),
    ...(data.weeklyRateKg !== undefined ? { weeklyRateKg: data.weeklyRateKg } : {}),
    ...(data.trainingDaysPerWeek !== undefined ? { trainingDaysPerWeek: data.trainingDaysPerWeek } : {}),
    ...(data.pregnancyStatus !== undefined ? { pregnancyStatus: data.pregnancyStatus } : {}),
    ...(data.allergies !== undefined ? { allergies: data.allergies } : {}),
    ...(data.medicalConditions !== undefined ? { medicalConditions: data.medicalConditions } : {}),
    ...(data.sleepHours !== undefined ? { sleepHours: data.sleepHours } : {}),
    ...(data.stressLevel !== undefined ? { stressLevel: data.stressLevel } : {}),
    ...(data.waterIntakeMl !== undefined ? { waterIntakeMl: data.waterIntakeMl } : {}),
  };

  const user = await completeOnboarding(req.userId!, onboardingInput);
  res.status(200).json(user);
});
