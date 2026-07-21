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

export function calculateBmr(input: { sex: Sex; weightKg: number; heightCm: number; age: number; bodyFatPercent?: number }): number {
  const { sex, weightKg, heightCm, age, bodyFatPercent } = input;
  if (bodyFatPercent !== undefined) {
    const lbm = weightKg * (1 - bodyFatPercent / 100);
    return 370 + 21.6 * lbm;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  return tdee * (1 + CALORIE_ADJUSTMENT[goal]);
}

const KCAL_PER_KG = 7700;

export function calculateTargetCalories(input: {
  tdee: number;
  goal: Goal;
  sex: Sex;
  weeklyRateKg?: number;
  pregnancyStatus?: 'none' | 'pregnant' | 'breastfeeding';
}): number {
  const { tdee, goal, sex, weeklyRateKg, pregnancyStatus } = input;
  let target: number;
  if (pregnancyStatus === 'pregnant') {
    target = tdee + 300;
  } else if (pregnancyStatus === 'breastfeeding') {
    target = tdee + 450;
  } else {
    const dailyDelta = ((weeklyRateKg ?? 0.5) * KCAL_PER_KG) / 7;
    if (goal === 'lose_fat') target = tdee - dailyDelta;
    else if (goal === 'gain_muscle') target = tdee + dailyDelta;
    else target = tdee;
  }
  const floor = sex === 'female' ? 1200 : 1500;
  target = Math.max(target, floor);
  return Math.round(target / 10) * 10;
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
