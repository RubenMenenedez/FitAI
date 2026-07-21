import { describe, it, expect } from 'vitest';
import { selectRecipeForSlot } from './recipeSelector';

const recipes = [
  { id: 'r1', mealType: 'breakfast' as const, tags: ['vegetarian'], baseCalories: 400 },
  { id: 'r2', mealType: 'breakfast' as const, tags: ['high_protein'], baseCalories: 450 },
];

describe('selectRecipeForSlot', () => {
  it('filtra por meal_type y excluye recetas usadas en los últimos N días', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 450,
      recentlyUsedRecipeIds: ['r2'], preferredTags: [],
    });
    expect(selected?.id).toBe('r1');
  });

  it('entre las candidatas, elige la de calorías base más cercana al objetivo', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 440,
      recentlyUsedRecipeIds: [], preferredTags: [],
    });
    expect(selected?.id).toBe('r2');
  });

  it('prioriza recetas que coincidan con las tags preferidas', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 400,
      recentlyUsedRecipeIds: [], preferredTags: ['high_protein'],
    });
    expect(selected?.id).toBe('r2');
  });
});
