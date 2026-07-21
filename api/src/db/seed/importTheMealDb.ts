import 'dotenv/config';
import { db } from '../client';
import { foodItems, recipes, recipeIngredients } from '../schema';
import { findBestFoodItemMatch } from './matchFoodItem';

const CATEGORY_TO_MEAL_TYPE: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
  Breakfast: 'breakfast',
  Starter: 'snack',
  Side: 'snack',
  Dessert: 'snack',
};

interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
}

function extractIngredients(meal: MealDbMeal): { name: string; measure: string }[] {
  const result: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name?.trim()) result.push({ name: name.trim(), measure: (measure ?? '').trim() });
  }
  return result;
}

function measureToGrams(measure: string): number {
  const match = measure.match(/([\d.]+)\s*(g|kg|ml|l)?/i);
  if (!match) return 100;
  const raw = match[1];
  if (raw === undefined) return 100;
  const value = parseFloat(raw);
  const unit = (match[2] ?? 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') return value * 1000;
  return value;
}

async function main() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const allFoodItems = await db.select({ id: foodItems.id, nameNormalized: foodItems.nameNormalized }).from(foodItems);

  for (const letter of letters) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    const { meals } = (await response.json()) as { meals: MealDbMeal[] | null };
    if (!meals) continue;

    for (const meal of meals) {
      const returned = await db.insert(recipes).values({
        source: 'themealdb',
        title: meal.strMeal,
        mealType: CATEGORY_TO_MEAL_TYPE[meal.strCategory] ?? 'lunch',
        tags: [meal.strCategory.toLowerCase()],
        baseServings: 1,
        instructions: meal.strInstructions,
        imageUrl: meal.strMealThumb,
      }).returning();
      const recipe = returned[0];
      if (!recipe) continue;

      const ingredients = extractIngredients(meal);
      for (const ingredient of ingredients) {
        const match = findBestFoodItemMatch(ingredient.name, allFoodItems);
        if (!match) continue;
        await db.insert(recipeIngredients).values({
          recipeId: recipe.id,
          foodItemId: match.id,
          baseGrams: String(measureToGrams(ingredient.measure)),
        });
      }
    }
    console.log(`letra ${letter} procesada`);
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
