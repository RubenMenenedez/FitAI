import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { calculateBmr, calculateTdee, calculateCalorieTarget, type Sex, type ActivityLevel, type Goal } from './calorieCalculator';
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
}

function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const diffMs = Date.now() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const age = ageFromBirthDate(input.birthDate);
  const bmr = calculateBmr({ sex: input.sex, weightKg: input.weightKg, heightCm: input.heightCm, age });
  const tdee = calculateTdee(bmr, input.activityLevel);
  const dailyCalorieTarget = calculateCalorieTarget(tdee, input.goal);
  const macros = applyDietModeMacros({ dietMode: input.dietMode ?? 'standard', weightKg: input.weightKg, dailyCalories: dailyCalorieTarget, goal: input.goal });

  const [updated] = await db.update(users).set({
    sex: input.sex,
    birthDate: input.birthDate,
    heightCm: String(input.heightCm),
    activityLevel: input.activityLevel,
    goal: input.goal,
    mealsPerDay: input.mealsPerDay,
    dietMode: input.dietMode ?? 'standard',
    dailyCalorieTarget: dailyCalorieTarget.toFixed(0),
    dailyProteinTargetG: macros.proteinG.toFixed(1),
    dailyCarbsTargetG: macros.carbsG.toFixed(1),
    dailyFatTargetG: macros.fatG.toFixed(1),
  }).where(eq(users.id, userId)).returning();

  return updated;
}
