export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export interface MealSlot { slotOrder: number; mealType: MealType; percentOfDailyCalories: number }

const THREE_MEALS: MealSlot[] = [
  { slotOrder: 0, mealType: 'breakfast', percentOfDailyCalories: 0.25 },
  { slotOrder: 1, mealType: 'lunch', percentOfDailyCalories: 0.40 },
  { slotOrder: 2, mealType: 'dinner', percentOfDailyCalories: 0.35 },
];

const FIVE_SIX_MEALS: MealSlot[] = [
  { slotOrder: 0, mealType: 'breakfast', percentOfDailyCalories: 0.20 },
  { slotOrder: 1, mealType: 'snack', percentOfDailyCalories: 0.10 },
  { slotOrder: 2, mealType: 'lunch', percentOfDailyCalories: 0.30 },
  { slotOrder: 3, mealType: 'snack', percentOfDailyCalories: 0.10 },
  { slotOrder: 4, mealType: 'dinner', percentOfDailyCalories: 0.25 },
  { slotOrder: 5, mealType: 'snack', percentOfDailyCalories: 0.05 },
];

export function getMealSlots(mealsPerDay: '3' | '5_6'): MealSlot[] {
  return mealsPerDay === '3' ? THREE_MEALS : FIVE_SIX_MEALS;
}
