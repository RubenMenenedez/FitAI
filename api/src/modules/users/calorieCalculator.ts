export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_fat' | 'maintain' | 'gain_muscle';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_fat: -0.175, // punto medio de -15% a -20%
  maintain: 0,
  gain_muscle: 0.125, // punto medio de +10% a +15%
};

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.2, // punto medio 2.0-2.4
  maintain: 1.8, // punto medio 1.6-2.0
  gain_muscle: 2.0, // punto medio 1.8-2.2
};

const FAT_PERCENT: Record<Goal, number> = {
  lose_fat: 0.275, // punto medio 25-30%
  maintain: 0.275,
  gain_muscle: 0.275,
};

export function calculateBmr(input: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const { sex, weightKg, heightCm, age } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  return tdee * (1 + CALORIE_ADJUSTMENT[goal]);
}

export interface Macros {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export function calculateMacros(input: { weightKg: number; dailyCalories: number; goal: Goal }): Macros {
  const { weightKg, dailyCalories, goal } = input;
  const proteinG = weightKg * PROTEIN_G_PER_KG[goal];
  const fatCalories = dailyCalories * FAT_PERCENT[goal];
  const fatG = fatCalories / 9;
  const proteinCalories = proteinG * 4;
  const carbCalories = dailyCalories - proteinCalories - fatCalories;
  const carbsG = Math.max(carbCalories, 0) / 4;
  return { proteinG, fatG, carbsG };
}
