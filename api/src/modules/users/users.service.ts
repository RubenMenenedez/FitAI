import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { calculateBmr, calculateTdee, calculateCalorieTarget, calculateTargetCalories, type Sex, type ActivityLevel, type Goal } from './calorieCalculator';
import { applyDietModeMacros, type DietMode } from '../dietModes/dietModePresets';

export interface OnboardingInput {
  sex: Sex;
  birthDate: string; // ISO date
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  mealsPerDay: '3' | '5_6';
  dietMode?: DietMode;
  bodyFatPercent?: number;
  targetWeightKg?: number;
  weeklyRateKg?: number;
  trainingDaysPerWeek?: number;
  pregnancyStatus?: 'none' | 'pregnant' | 'breastfeeding';
  allergies?: string[];
  medicalConditions?: string[];
  sleepHours?: number;
  stressLevel?: 'low' | 'medium' | 'high';
  waterIntakeMl?: number;
}

function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const diffMs = Date.now() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const {
    sex, birthDate, heightCm, weightKg, activityLevel, goal, mealsPerDay,
    bodyFatPercent, targetWeightKg, weeklyRateKg, trainingDaysPerWeek,
    pregnancyStatus, allergies, medicalConditions, sleepHours, stressLevel, waterIntakeMl,
  } = input;

  const age = ageFromBirthDate(birthDate);
  const bmr = calculateBmr({
    sex,
    weightKg,
    heightCm,
    age,
    ...(bodyFatPercent !== undefined ? { bodyFatPercent } : {}),
  });
  const tdee = calculateTdee(bmr, activityLevel);
  const dailyCalorieTarget = calculateTargetCalories({
    tdee,
    goal,
    sex,
    ...(weeklyRateKg !== undefined ? { weeklyRateKg } : {}),
    ...(pregnancyStatus !== undefined ? { pregnancyStatus } : {}),
  });
  const macros = applyDietModeMacros({
    dietMode: input.dietMode ?? 'standard',
    weightKg,
    dailyCalories: dailyCalorieTarget,
    goal,
    ...(medicalConditions !== undefined ? { medicalConditions } : {}),
  });

  const setValues: Parameters<ReturnType<typeof db.update>['set']>[0] = {
    sex,
    birthDate,
    heightCm: String(heightCm),
    activityLevel,
    goal,
    mealsPerDay,
    dietMode: input.dietMode ?? 'standard',
    dailyCalorieTarget: dailyCalorieTarget.toFixed(0),
    dailyProteinTargetG: macros.proteinG.toFixed(1),
    dailyCarbsTargetG: macros.carbsG.toFixed(1),
    dailyFatTargetG: macros.fatG.toFixed(1),
    ...(bodyFatPercent !== undefined ? { bodyFatPercent: String(bodyFatPercent) } : {}),
    ...(targetWeightKg !== undefined ? { targetWeightKg: String(targetWeightKg) } : {}),
    ...(weeklyRateKg !== undefined ? { weeklyRateKg: String(weeklyRateKg) } : {}),
    ...(trainingDaysPerWeek !== undefined ? { trainingDaysPerWeek } : {}),
    ...(pregnancyStatus !== undefined ? { pregnancyStatus } : {}),
    ...(allergies !== undefined ? { allergies } : {}),
    ...(medicalConditions !== undefined ? { medicalConditions } : {}),
    ...(sleepHours !== undefined ? { sleepHours: String(sleepHours) } : {}),
    ...(stressLevel !== undefined ? { stressLevel } : {}),
    ...(waterIntakeMl !== undefined ? { waterIntakeMl: String(waterIntakeMl) } : {}),
  };

  const [updated] = await db.update(users).set(setValues).where(eq(users.id, userId)).returning();

  return updated;
}
