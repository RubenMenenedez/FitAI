import { describe, it, expect } from 'vitest';
import { buildWeeklyPlanItems } from './mealPlans.service';

describe('buildWeeklyPlanItems', () => {
  it('genera 7 días × slots de mealsPerDay, cada uno con receta, scale_factor y target_calories', () => {
    const recipes = [
      { id: 'b1', mealType: 'breakfast' as const, tags: [], baseCalories: 400 },
      { id: 'l1', mealType: 'lunch' as const, tags: [], baseCalories: 600 },
      { id: 'd1', mealType: 'dinner' as const, tags: [], baseCalories: 500 },
    ];

    const items = buildWeeklyPlanItems({
      dailyCalorieTarget: 2000,
      mealsPerDay: '3',
      recipes,
      preferredTags: [],
    });

    expect(items).toHaveLength(21); // 7 días * 3 comidas
    expect(items[0]).toMatchObject({ dayOfWeek: 0, mealType: 'breakfast', recipeId: 'b1' });
    expect(items[0].targetCalories).toBeCloseTo(500); // 25% de 2000
    expect(items[0].scaleFactor).toBeGreaterThan(0);
  });
});
