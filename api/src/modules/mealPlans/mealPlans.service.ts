import { db } from '../../db/client';
import { mealPlans, mealPlanItems, recipes as recipesTable, recipeIngredients, foodItems, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getMealSlots } from './mealDistribution';
import { selectRecipeForSlot, RECENT_DAYS, type CandidateRecipe } from './recipeSelector';
import { baseCalories, clampScaleFactor } from './recipeScaling';

export interface BuildPlanInput {
  dailyCalorieTarget: number;
  mealsPerDay: '3' | '5_6';
  recipes: CandidateRecipe[];
  preferredTags: string[];
}

export function buildWeeklyPlanItems(input: BuildPlanInput) {
  const slots = getMealSlots(input.mealsPerDay);
  const items: { dayOfWeek: number; slotOrder: number; mealType: string; recipeId: string; scaleFactor: number; targetCalories: number }[] = [];
  const recentlyUsed: string[] = [];

  for (let day = 0; day < 7; day += 1) {
    for (const slot of slots) {
      const targetCalories = input.dailyCalorieTarget * slot.percentOfDailyCalories;
      const recipe = selectRecipeForSlot({
        recipes: input.recipes,
        mealType: slot.mealType,
        targetCalories,
        recentlyUsedRecipeIds: recentlyUsed.slice(-RECENT_DAYS * slots.length),
        preferredTags: input.preferredTags,
      }) ?? selectRecipeForSlot({
        recipes: input.recipes,
        mealType: slot.mealType,
        targetCalories,
        recentlyUsedRecipeIds: [],
        preferredTags: input.preferredTags,
      });
      if (!recipe) continue;

      const scaleFactor = clampScaleFactor(targetCalories / recipe.baseCalories);
      items.push({ dayOfWeek: day, slotOrder: slot.slotOrder, mealType: slot.mealType, recipeId: recipe.id, scaleFactor, targetCalories });
      recentlyUsed.push(recipe.id);
    }
  }
  return items;
}

export async function generateWeeklyPlan(userId: string, weekStartDate: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('user not found');

  const allRecipes = await db.select().from(recipesTable);
  const allIngredients = await db.select().from(recipeIngredients);
  const allFoodItems = await db.select().from(foodItems);
  const foodItemById = new Map(allFoodItems.map((f) => [f.id, f]));

  const candidateRecipes: CandidateRecipe[] = allRecipes.map((r) => {
    const ingredients = allIngredients
      .filter((ri) => ri.recipeId === r.id)
      .map((ri) => ({
        foodItemId: ri.foodItemId,
        baseGrams: Number(ri.baseGrams),
        caloriesPer100g: Number(foodItemById.get(ri.foodItemId)?.caloriesPer100g ?? 0),
      }));
    return { id: r.id, mealType: r.mealType, tags: r.tags ?? [], baseCalories: baseCalories(ingredients) };
  });

  const items = buildWeeklyPlanItems({
    dailyCalorieTarget: Number(user.dailyCalorieTarget),
    mealsPerDay: (user.mealsPerDay ?? '3') as '3' | '5_6',
    recipes: candidateRecipes,
    preferredTags: [],
  });

  const [plan] = await db.insert(mealPlans).values({ userId, weekStartDate }).returning();
  if (!plan) throw new Error('failed to create meal plan');

  if (items.length > 0) {
    await db.insert(mealPlanItems).values(items.map((it) => ({
      mealPlanId: plan.id,
      dayOfWeek: it.dayOfWeek,
      slotOrder: it.slotOrder,
      mealType: it.mealType as any,
      recipeId: it.recipeId,
      scaleFactor: it.scaleFactor.toFixed(3),
      targetCalories: it.targetCalories.toFixed(0),
    })));
  }
  return plan;
}
