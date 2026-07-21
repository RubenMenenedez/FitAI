import 'dotenv/config';
import { db } from '../client';
import { foodItems, recipes, recipeIngredients } from '../schema';
import { and, eq, inArray } from 'drizzle-orm';
import { findBestFoodItemMatch } from './matchFoodItem';

// Curated breakfast recipes to enrich the plan (TheMealDB only provides ~19
// breakfast-category meals). Ingredients are matched against the imported USDA
// food_items by the same fuzzy matcher used for TheMealDB, so calories/macros
// come from real nutrition data. Source is 'ai_generated' (app-curated), which
// also makes this script idempotent: it clears prior ai_generated breakfasts
// before re-inserting.

interface BreakfastDef {
  title: string;
  tags: string[];
  ingredients: [query: string, grams: number][];
}

const BREAKFASTS: BreakfastDef[] = [
  { title: 'Scrambled Eggs with Cheddar', tags: ['high_protein'], ingredients: [['egg', 150], ['butter', 10], ['cheddar cheese', 30]] },
  { title: 'Classic Fried Eggs', tags: ['high_protein'], ingredients: [['egg', 150], ['olive oil', 8]] },
  { title: 'Cheese Omelette', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 150], ['cheddar cheese', 40], ['butter', 10]] },
  { title: 'Ham & Cheese Omelette', tags: ['high_protein'], ingredients: [['egg', 150], ['ham', 50], ['cheddar cheese', 30]] },
  { title: 'Egg White Veggie Scramble', tags: ['high_protein', 'low_fat'], ingredients: [['egg white', 200], ['tomato', 80], ['onion', 40], ['olive oil', 6]] },
  { title: 'Turkey Sausage & Eggs', tags: ['high_protein'], ingredients: [['turkey sausage', 100], ['egg', 100]] },
  { title: 'Kale & Egg Scramble', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 150], ['kale', 60], ['olive oil', 8]] },
  { title: 'Mozzarella & Tomato Eggs', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 150], ['mozzarella cheese', 40], ['tomato', 80]] },
  { title: 'Three-Cheese Eggs', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 150], ['cheddar cheese', 20], ['mozzarella cheese', 20], ['parmesan cheese', 10]] },
  { title: 'Ham & Egg Cups', tags: ['high_protein'], ingredients: [['egg', 100], ['ham', 60]] },
  { title: 'Greek Yogurt, Almonds & Banana', tags: ['vegetarian', 'high_protein'], ingredients: [['greek yogurt', 200], ['almonds', 30], ['banana', 100]] },
  { title: 'Strawberry Yogurt Bowl', tags: ['vegetarian'], ingredients: [['strawberry yogurt', 200], ['almonds', 20], ['banana', 80]] },
  { title: 'Greek Yogurt & Fresh Fruit', tags: ['vegetarian'], ingredients: [['greek yogurt', 200], ['orange', 130], ['banana', 80]] },
  { title: 'Cottage Cheese with Apple', tags: ['vegetarian', 'high_protein'], ingredients: [['cottage cheese', 200], ['apple', 120]] },
  { title: 'Apple & Almond Yogurt Bowl', tags: ['vegetarian'], ingredients: [['greek yogurt', 200], ['apple', 120], ['almonds', 25]] },
  { title: 'Orange & Yogurt Breakfast', tags: ['vegetarian'], ingredients: [['greek yogurt', 200], ['orange', 130], ['almonds', 20]] },
  { title: 'Banana Milk Smoothie', tags: ['vegetarian'], ingredients: [['milk', 250], ['banana', 120], ['almonds', 20]] },
  { title: 'Banana Nut Shake', tags: ['vegetarian'], ingredients: [['milk', 250], ['banana', 120], ['almonds', 25]] },
  { title: 'Banana Pancakes', tags: ['vegetarian'], ingredients: [['wheat flour', 80], ['egg', 50], ['milk', 120], ['banana', 100], ['butter', 10]] },
  { title: 'Apple Pancakes', tags: ['vegetarian'], ingredients: [['wheat flour', 80], ['egg', 50], ['milk', 120], ['apple', 100]] },
  { title: 'Cheese Crepes', tags: ['vegetarian'], ingredients: [['wheat flour', 70], ['egg', 50], ['milk', 120], ['cheddar cheese', 40]] },
  { title: 'French Toast', tags: ['vegetarian'], ingredients: [['wheat flour', 60], ['egg', 50], ['milk', 100], ['butter', 8], ['sugar', 5]] },
  { title: 'Ricotta Crepe', tags: ['vegetarian'], ingredients: [['wheat flour', 60], ['egg', 50], ['ricotta cheese', 100]] },
  { title: 'Cheddar & Egg Muffin', tags: ['high_protein'], ingredients: [['egg', 100], ['american cheese', 30], ['wheat flour', 40]] },
  { title: 'Corn Porridge', tags: ['vegetarian'], ingredients: [['corn flour', 60], ['milk', 200], ['butter', 8]] },
  { title: 'Rice Porridge', tags: ['vegetarian'], ingredients: [['rice flour', 60], ['milk', 200], ['sugar', 10]] },
  { title: 'Swiss Cheese & Ham Toast', tags: ['high_protein'], ingredients: [['wheat flour', 60], ['swiss cheese', 40], ['ham', 40]] },
  { title: 'Veggie Egg White Omelette', tags: ['low_fat', 'high_protein', 'vegetarian'], ingredients: [['egg white', 200], ['mozzarella cheese', 30], ['tomato', 60]] },
  { title: 'Turkey & Egg Breakfast Bowl', tags: ['high_protein'], ingredients: [['ground turkey', 90], ['egg', 100], ['onion', 30]] },
  { title: 'Cinnamon Banana Yogurt', tags: ['vegetarian'], ingredients: [['greek yogurt', 200], ['banana', 120], ['almonds', 20]] },
  { title: 'Parmesan Baked Eggs', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 150], ['parmesan cheese', 25], ['tomato', 70]] },
  { title: 'Simple Yogurt & Banana', tags: ['vegetarian'], ingredients: [['greek yogurt', 200], ['banana', 120]] },
  { title: 'Cheddar Scramble with Ham', tags: ['high_protein'], ingredients: [['egg', 150], ['ham', 40], ['cheddar cheese', 25]] },
  { title: 'Mozzarella Egg Muffins', tags: ['high_protein', 'vegetarian'], ingredients: [['egg', 120], ['mozzarella cheese', 40], ['onion', 20]] },
  { title: 'Apple Cottage Bowl', tags: ['vegetarian', 'high_protein'], ingredients: [['cottage cheese', 180], ['apple', 100], ['almonds', 20]] },
  { title: 'Orange Almond Yogurt', tags: ['vegetarian'], ingredients: [['greek yogurt', 180], ['orange', 120], ['almonds', 25]] },
  { title: 'Butter & Egg Breakfast', tags: ['high_protein'], ingredients: [['egg', 150], ['butter', 12]] },
  { title: 'Ham & Swiss Scramble', tags: ['high_protein'], ingredients: [['egg', 150], ['ham', 50], ['swiss cheese', 30]] },
  { title: 'Banana Cheese Crepe', tags: ['vegetarian'], ingredients: [['wheat flour', 60], ['egg', 50], ['milk', 100], ['banana', 90]] },
  { title: 'Protein Yogurt & Nuts', tags: ['vegetarian', 'high_protein'], ingredients: [['greek yogurt', 250], ['almonds', 30]] },
];

async function main() {
  const allFoodItems = await db
    .select({ id: foodItems.id, nameNormalized: foodItems.nameNormalized })
    .from(foodItems);

  // Idempotency: remove previously seeded ai_generated breakfasts + their ingredients.
  const existing = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.source, 'ai_generated'), eq(recipes.mealType, 'breakfast')));
  if (existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await db.delete(recipeIngredients).where(inArray(recipeIngredients.recipeId, ids));
    await db.delete(recipes).where(inArray(recipes.id, ids));
    console.log(`removed ${existing.length} previously seeded breakfasts`);
  }

  let inserted = 0;
  let matchedIngredients = 0;
  for (const def of BREAKFASTS) {
    const [recipe] = await db.insert(recipes).values({
      source: 'ai_generated',
      title: def.title,
      mealType: 'breakfast',
      tags: def.tags,
      baseServings: 1,
      instructions: null,
      imageUrl: null,
    }).returning();
    if (!recipe) continue;
    inserted += 1;

    for (const [query, grams] of def.ingredients) {
      const match = findBestFoodItemMatch(query, allFoodItems);
      if (!match) {
        console.warn(`  [!] no match for "${query}" in "${def.title}"`);
        continue;
      }
      await db.insert(recipeIngredients).values({
        recipeId: recipe.id,
        foodItemId: match.id,
        baseGrams: String(grams),
      });
      matchedIngredients += 1;
    }
  }

  console.log(`inserted ${inserted} breakfast recipes, ${matchedIngredients} matched ingredients`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
