import { calculateMacros, type Goal } from '../users/calorieCalculator';

export type DietMode = 'standard' | 'keto' | 'high_protein' | 'vegetarian_vegan';

export interface DietModeMacroInput {
  dietMode: DietMode;
  weightKg: number;
  dailyCalories: number;
  goal?: Goal;
}

export function applyDietModeMacros(input: DietModeMacroInput) {
  if (input.dietMode === 'keto') {
    const fatCalories = input.dailyCalories * 0.70;
    const proteinCalories = input.dailyCalories * 0.20;
    const carbCalories = input.dailyCalories * 0.10;
    return { proteinG: proteinCalories / 4, fatG: fatCalories / 9, carbsG: carbCalories / 4 };
  }

  if (input.dietMode === 'high_protein') {
    const proteinG = input.weightKg * 2.4;
    const fatCalories = input.dailyCalories * 0.275;
    const fatG = fatCalories / 9;
    const carbCalories = input.dailyCalories - proteinG * 4 - fatCalories;
    return { proteinG, fatG, carbsG: Math.max(carbCalories, 0) / 4 };
  }

  // 'standard' y 'vegetarian_vegan' usan el reparto por objetivo (sección 5.4).
  return calculateMacros({ weightKg: input.weightKg, dailyCalories: input.dailyCalories, goal: input.goal ?? 'maintain' });
}
