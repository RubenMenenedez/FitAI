import { describe, it, expect } from 'vitest';
import { getMealSlots } from './mealDistribution';

describe('getMealSlots', () => {
  it('devuelve 3 slots que suman 100% para mealsPerDay = 3', () => {
    const slots = getMealSlots('3');
    expect(slots).toHaveLength(3);
    expect(slots.reduce((sum, s) => sum + s.percentOfDailyCalories, 0)).toBeCloseTo(1);
    expect(slots.map((s) => s.mealType)).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('devuelve 6 slots que suman 100% para mealsPerDay = 5_6', () => {
    const slots = getMealSlots('5_6');
    expect(slots).toHaveLength(6);
    expect(slots.reduce((sum, s) => sum + s.percentOfDailyCalories, 0)).toBeCloseTo(1);
  });
});
