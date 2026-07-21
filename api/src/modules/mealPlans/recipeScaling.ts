export interface ScalableIngredient { foodItemId: string; baseGrams: number; caloriesPer100g: number }

export function baseCalories(ingredients: ScalableIngredient[]): number {
  return ingredients.reduce((sum, ing) => sum + (ing.baseGrams / 100) * ing.caloriesPer100g, 0);
}

export function calculateScaleFactor(input: { targetCalories: number; ingredients: ScalableIngredient[] }): number {
  const base = baseCalories(input.ingredients);
  if (base === 0) return 1;
  return input.targetCalories / base;
}

// Límites de la sección 6.2: fuera de este rango se recomienda combinar con otra receta
// en vez de escalar (una receta a 0.1x o 5x deja de parecerse al plato original).
export function clampScaleFactor(factor: number): number {
  return Math.min(Math.max(factor, 0.5), 2.5);
}

export function scaleIngredients(ingredients: ScalableIngredient[], scaleFactor: number) {
  return ingredients.map((ing) => ({ foodItemId: ing.foodItemId, grams: ing.baseGrams * scaleFactor }));
}
