export interface CandidateRecipe { id: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; tags: string[]; baseCalories: number }

export interface SelectRecipeInput {
  recipes: CandidateRecipe[];
  mealType: CandidateRecipe['mealType'];
  targetCalories: number;
  recentlyUsedRecipeIds: string[]; // últimos 3 días (constante RECENT_DAYS)
  preferredTags: string[];
}

export const RECENT_DAYS = 3;

// Lunch and dinner are both main meals drawn from the same pool of main dishes:
// a recipe classified as `lunch` is equally valid for a `dinner` slot and vice
// versa. Breakfast and snack keep their own pools. Repetition across a day/recent
// days (so lunch and dinner aren't the same dish) is handled by
// `recentlyUsedRecipeIds`, which already excludes the day's earlier picks.
export function eligibleMealTypes(slot: CandidateRecipe['mealType']): CandidateRecipe['mealType'][] {
  return slot === 'lunch' || slot === 'dinner' ? ['lunch', 'dinner'] : [slot];
}

export function selectRecipeForSlot(input: SelectRecipeInput): CandidateRecipe | undefined {
  const eligible = eligibleMealTypes(input.mealType);
  const candidates = input.recipes.filter(
    (r) => eligible.includes(r.mealType) && !input.recentlyUsedRecipeIds.includes(r.id),
  );
  if (candidates.length === 0) return undefined;

  const withTagMatch = input.preferredTags.length > 0
    ? candidates.filter((r) => r.tags.some((t) => input.preferredTags.includes(t)))
    : [];
  const pool = withTagMatch.length > 0 ? withTagMatch : candidates;

  return pool.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.baseCalories - input.targetCalories);
    const currentDiff = Math.abs(current.baseCalories - input.targetCalories);
    return currentDiff < closestDiff ? current : closest;
  });
}
