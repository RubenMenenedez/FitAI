import 'dotenv/config';
import { db } from '../client';
import { foodItems, recipes, recipeIngredients } from '../schema';
import { and, eq, inArray } from 'drizzle-orm';
import { findBestFoodItemMatch } from './matchFoodItem';

// Curated breakfast library to enrich the meal planner (TheMealDB only ships
// ~19 breakfast-category meals). Recipes are generated from templates that vary
// one ingredient (cheese / fruit / meat / veg / flour), giving ~110+ distinct
// breakfasts. Every ingredient is fuzzy-matched against the imported USDA
// food_items, so calories/macros come from real nutrition data. Source is
// 'ai_generated', and the script is idempotent (it clears prior ai_generated
// breakfasts before re-inserting).

interface BreakfastDef {
  title: string;
  tags: string[];
  ingredients: [query: string, grams: number][];
}

type Opt = { q: string; name: string };

const CHEESES: Opt[] = [
  { q: 'cheddar cheese', name: 'Cheddar' },
  { q: 'mozzarella cheese', name: 'Mozzarella' },
  { q: 'swiss cheese', name: 'Swiss' },
  { q: 'parmesan cheese', name: 'Parmesan' },
  { q: 'american cheese', name: 'American' },
  { q: 'cottage cheese', name: 'Cottage Cheese' },
  { q: 'ricotta cheese', name: 'Ricotta' },
];
const FRUITS: Opt[] = [
  { q: 'banana', name: 'Banana' },
  { q: 'apple', name: 'Apple' },
  { q: 'orange', name: 'Orange' },
];
const VEG: Opt[] = [
  { q: 'kale', name: 'Kale' },
  { q: 'tomato', name: 'Tomato' },
  { q: 'onion', name: 'Onion' },
];
const MEATS: Opt[] = [
  { q: 'ham', name: 'Ham' },
  { q: 'turkey sausage', name: 'Turkey Sausage' },
  { q: 'ground turkey', name: 'Ground Turkey' },
  { q: 'chicken breast', name: 'Chicken' },
];
const FLOURS: Opt[] = [
  { q: 'rice flour', name: 'Rice' },
  { q: 'corn flour', name: 'Corn' },
  { q: 'whole wheat flour', name: 'Whole Wheat' },
];

const veg = ['vegetarian'];
const hp = ['high_protein'];
const vhp = ['vegetarian', 'high_protein'];

const defs: BreakfastDef[] = [];

// Template families (each varies one ingredient) ---------------------------
for (const c of CHEESES) defs.push({ title: `${c.name} Omelette`, tags: vhp, ingredients: [['egg', 150], [c.q, 40], ['butter', 8]] });
for (const c of CHEESES) defs.push({ title: `Ham & ${c.name} Omelette`, tags: hp, ingredients: [['egg', 150], ['ham', 50], [c.q, 30]] });
for (const c of CHEESES) defs.push({ title: `${c.name} Scramble`, tags: vhp, ingredients: [['egg', 150], [c.q, 35], ['butter', 8]] });
for (const c of CHEESES) defs.push({ title: `${c.name} & Tomato Baked Eggs`, tags: vhp, ingredients: [['egg', 150], [c.q, 30], ['tomato', 70]] });
for (const c of CHEESES) defs.push({ title: `${c.name} Egg Muffins`, tags: vhp, ingredients: [['egg', 120], [c.q, 35], ['onion', 20]] });
for (const c of CHEESES) defs.push({ title: `${c.name} Frittata`, tags: vhp, ingredients: [['egg', 150], [c.q, 35], ['onion', 30], ['olive oil', 6]] });
for (const c of ['cheddar cheese', 'mozzarella cheese', 'swiss cheese', 'ricotta cheese'].map((q) => CHEESES.find((x) => x.q === q)!))
  defs.push({ title: `${c.name} Crepes`, tags: veg, ingredients: [['wheat flour', 65], ['egg', 50], ['milk', 110], [c.q, 40]] });

for (const v of VEG) defs.push({ title: `${v.name} & Cheddar Eggs`, tags: vhp, ingredients: [['egg', 150], [v.q, 70], ['cheddar cheese', 30]] });
for (const v of VEG) defs.push({ title: `${v.name} Egg White Scramble`, tags: [...vhp, 'low_fat'], ingredients: [['egg white', 200], [v.q, 70], ['olive oil', 6]] });

for (const f of FRUITS) defs.push({ title: `${f.name} Greek Yogurt Bowl`, tags: vhp, ingredients: [['greek yogurt', 200], [f.q, 120]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Yogurt with Almonds`, tags: veg, ingredients: [['greek yogurt', 200], [f.q, 100], ['almonds', 25]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Milk Smoothie`, tags: veg, ingredients: [['milk', 250], [f.q, 120], ['almonds', 20]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Protein Smoothie`, tags: vhp, ingredients: [['greek yogurt', 180], ['milk', 150], [f.q, 110]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Pancakes`, tags: veg, ingredients: [['wheat flour', 80], ['egg', 50], ['milk', 120], [f.q, 100]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Cottage Cheese Bowl`, tags: vhp, ingredients: [['cottage cheese', 200], [f.q, 110]] });
for (const f of FRUITS) defs.push({ title: `${f.name} Ricotta Toast`, tags: veg, ingredients: [['wheat flour', 55], ['ricotta cheese', 80], [f.q, 90]] });

for (const m of MEATS) defs.push({ title: `${m.name} & Eggs`, tags: hp, ingredients: [['egg', 130], [m.q, 80]] });
for (const m of MEATS) defs.push({ title: `${m.name} Egg Muffins`, tags: hp, ingredients: [['egg', 120], [m.q, 60], ['onion', 20]] });
for (const m of [MEATS[0]!, MEATS[1]!]) for (const c of ['cheddar cheese', 'swiss cheese', 'mozzarella cheese'].map((q) => CHEESES.find((x) => x.q === q)!))
  defs.push({ title: `${m.name} & ${c.name} Scramble`, tags: hp, ingredients: [['egg', 150], [m.q, 45], [c.q, 25]] });

for (const fl of FLOURS) defs.push({ title: `${fl.name} Porridge`, tags: veg, ingredients: [['milk', 200], [fl.q, 55], ['butter', 6]] });
for (const fl of FLOURS) defs.push({ title: `Banana ${fl.name} Porridge`, tags: veg, ingredients: [['milk', 200], [fl.q, 50], ['banana', 90]] });

// Fixed singles -----------------------------------------------------------
defs.push(
  { title: 'Classic Fried Eggs', tags: hp, ingredients: [['egg', 150], ['olive oil', 8]] },
  { title: 'Buttered Scrambled Eggs', tags: hp, ingredients: [['egg', 150], ['butter', 12]] },
  { title: 'Boiled Eggs & Toast', tags: hp, ingredients: [['egg', 120], ['wheat flour', 50]] },
  { title: 'Three-Cheese Eggs', tags: vhp, ingredients: [['egg', 150], ['cheddar cheese', 20], ['mozzarella cheese', 20], ['parmesan cheese', 10]] },
  { title: 'French Toast', tags: veg, ingredients: [['wheat flour', 60], ['egg', 50], ['milk', 100], ['butter', 8], ['sugar', 5]] },
  { title: 'Cinnamon Sugar Toast', tags: veg, ingredients: [['wheat flour', 60], ['butter', 10], ['sugar', 8]] },
  { title: 'Ham & Swiss Melt', tags: hp, ingredients: [['wheat flour', 60], ['swiss cheese', 40], ['ham', 40]] },
  { title: 'Turkey Sausage Breakfast Bowl', tags: hp, ingredients: [['turkey sausage', 100], ['egg', 100], ['onion', 30]] },
  { title: 'Kale & Egg Scramble', tags: vhp, ingredients: [['egg', 150], ['kale', 60], ['olive oil', 8]] },
  { title: 'Protein Yogurt & Nuts', tags: vhp, ingredients: [['greek yogurt', 250], ['almonds', 30]] },
  { title: 'Strawberry Yogurt Crunch', tags: veg, ingredients: [['strawberry yogurt', 200], ['almonds', 25], ['banana', 80]] },
  { title: 'Banana Nut Shake', tags: veg, ingredients: [['milk', 250], ['banana', 120], ['almonds', 25]] },
  { title: 'Coconut Banana Oatless Bowl', tags: veg, ingredients: [['greek yogurt', 200], ['banana', 110], ['coconut oil', 6]] },
  { title: 'Veggie Egg White Omelette', tags: [...vhp, 'low_fat'], ingredients: [['egg white', 200], ['mozzarella cheese', 30], ['tomato', 60]] },
  { title: 'Salmon & Scrambled Eggs', tags: hp, ingredients: [['egg', 130], ['salmon', 70]] },
  { title: 'Cheddar Corn Cakes', tags: veg, ingredients: [['corn flour', 70], ['egg', 40], ['milk', 90], ['cheddar cheese', 30]] },
);

// Dedupe by title (defensive) ---------------------------------------------
const BREAKFASTS = defs.filter((d, i) => defs.findIndex((x) => x.title === d.title) === i);

async function main() {
  const allFoodItems = await db
    .select({ id: foodItems.id, nameNormalized: foodItems.nameNormalized })
    .from(foodItems);

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
  const unmatched = new Set<string>();
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
      if (!match) { unmatched.add(query); continue; }
      await db.insert(recipeIngredients).values({
        recipeId: recipe.id,
        foodItemId: match.id,
        baseGrams: String(grams),
      });
      matchedIngredients += 1;
    }
  }

  console.log(`inserted ${inserted} breakfast recipes, ${matchedIngredients} matched ingredients`);
  if (unmatched.size > 0) console.warn(`unmatched ingredient queries: ${[...unmatched].join(', ')}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
