import { describe, it, expect } from 'vitest';
import { calculateScaleFactor, scaleIngredients, clampScaleFactor } from './recipeScaling';

const recipeIngredients = [
  { foodItemId: 'chicken', baseGrams: 150, caloriesPer100g: 165 },
  { foodItemId: 'rice', baseGrams: 100, caloriesPer100g: 130 },
];

describe('calculateScaleFactor', () => {
  it('divide las calorías objetivo entre las calorías base de la receta', () => {
    const factor = calculateScaleFactor({ targetCalories: 755, ingredients: recipeIngredients });
    expect(factor).toBeCloseTo(2);
  });
});

describe('scaleIngredients', () => {
  it('multiplica base_grams por el scale_factor para cada ingrediente', () => {
    const scaled = scaleIngredients(recipeIngredients, 2);
    expect(scaled[0].grams).toBeCloseTo(300);
    expect(scaled[1].grams).toBeCloseTo(200);
  });
});

describe('clampScaleFactor', () => {
  it('deja pasar factores dentro de 0.5x-2.5x', () => expect(clampScaleFactor(1.5)).toBe(1.5));
  it('limita por debajo a 0.5x', () => expect(clampScaleFactor(0.2)).toBe(0.5));
  it('limita por arriba a 2.5x', () => expect(clampScaleFactor(4)).toBe(2.5));
});
