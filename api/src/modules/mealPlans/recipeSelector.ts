export interface CandidateRecipe { id: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; tags: string[]; baseCalories: number }

export interface SelectRecipeInput {
  recipes: CandidateRecipe[];
  mealType: CandidateRecipe['mealType'];
  targetCalories: number;
  recentlyUsedRecipeIds: string[]; // últimos 3 días (constante RECENT_DAYS)
  preferredTags: string[];
}

export const RECENT_DAYS = 3;

export function selectRecipeForSlot(input: SelectRecipeInput): CandidateRecipe | undefined {
  const candidates = input.recipes.filter(
    (r) => r.mealType === input.mealType && !input.recentlyUsedRecipeIds.includes(r.id),
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
