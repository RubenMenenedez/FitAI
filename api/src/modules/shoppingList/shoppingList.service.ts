import { db } from '../../db/client';
import { mealPlanItems, recipeIngredients, supermarketPrices, foodItems, mealPlans } from '../../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export function aggregateGramsByFoodItem(items: { foodItemId: string; grams: number }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.foodItemId, (totals.get(item.foodItemId) ?? 0) + item.grams);
  }
  return totals;
}

export interface PackageOption { packageSizeG: number; price: number; productNameRaw: string }

export function suggestBestPackage(neededGrams: number, packages: PackageOption[]): PackageOption | undefined {
  if (packages.length === 0) return undefined;

  function leftoverFor(pkg: PackageOption): number {
    const unitsNeeded = Math.ceil(neededGrams / pkg.packageSizeG);
    return unitsNeeded * pkg.packageSizeG - neededGrams;
  }

  function unitsFor(pkg: PackageOption): number {
    return Math.ceil(neededGrams / pkg.packageSizeG);
  }

  return packages.reduce((best, current) => {
    const bestLeftover = leftoverFor(best);
    const currentLeftover = leftoverFor(current);
    if (currentLeftover < bestLeftover) return current;
    if (currentLeftover === bestLeftover) {
      const bestUnits = unitsFor(best);
      const currentUnits = unitsFor(current);
      if (currentUnits < bestUnits) return current;
      if (currentUnits === bestUnits && current.price < best.price) return current;
    }
    return best;
  });
}

export async function generateShoppingList(userId: string, mealPlanId: string) {
  const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, mealPlanId));
  if (!plan || plan.userId !== userId) throw new Error('meal plan not found for this user');

  const items = await db.select().from(mealPlanItems).where(eq(mealPlanItems.mealPlanId, mealPlanId));
  const recipeIds = items.map((i) => i.recipeId);
  const ingredients = await db.select().from(recipeIngredients).where(inArray(recipeIngredients.recipeId, recipeIds));

  const gramsPerIngredient = items.flatMap((item) =>
    ingredients
      .filter((ing) => ing.recipeId === item.recipeId)
      .map((ing) => ({ foodItemId: ing.foodItemId, grams: Number(ing.baseGrams) * Number(item.scaleFactor) })),
  );
  const totals = aggregateGramsByFoodItem(gramsPerIngredient);

  const allPrices = await db.select().from(supermarketPrices).where(inArray(supermarketPrices.foodItemId, [...totals.keys()])).orderBy(desc(supermarketPrices.scrapedAt));
  const allFoodItems = await db.select().from(foodItems).where(inArray(foodItems.id, [...totals.keys()]));
  const foodItemById = new Map(allFoodItems.map((f) => [f.id, f]));

  return [...totals.entries()].map(([foodItemId, neededGrams]) => {
    const packages = allPrices
      .filter((p) => p.foodItemId === foodItemId)
      .map((p) => ({ packageSizeG: Number(p.packageSizeG), price: Number(p.price), productNameRaw: p.productNameRaw }));
    const suggestion = suggestBestPackage(neededGrams, packages);
    return {
      foodItemId,
      foodName: foodItemById.get(foodItemId)?.name ?? 'desconocido',
      neededGrams,
      suggestedPackage: suggestion ?? null,
    };
  });
}
