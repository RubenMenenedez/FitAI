import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../client';
import { foodItems } from '../schema';
import { normalizeName } from './normalizeName';

// Energy (kcal) is stored under different nutrient ids in Foundation Foods:
//   1008 = Energy, 2048 = Energy (Atwater Specific), 2047 = Energy (Atwater General).
// Only ~95/395 records populate 1008, so we fall back through the Atwater ids.
const CALORIE_IDS = [1008, 2048, 2047] as const;
const NUTRIENT_IDS = { protein: 1003, fat: 1004, carbs: 1005 } as const;

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: { nutrient?: { id?: number; unitName?: string }; amount?: number }[];
}

function nutrientAmount(food: UsdaFood, nutrientId: number): number {
  return food.foodNutrients.find((n) => n?.nutrient?.id === nutrientId)?.amount ?? 0;
}

function calorieAmount(food: UsdaFood): number {
  for (const id of CALORIE_IDS) {
    const match = food.foodNutrients.find(
      (n) => n?.nutrient?.id === id && n?.nutrient?.unitName === 'kcal',
    );
    if (match?.amount != null) return match.amount;
  }
  return 0;
}

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, 'data/foundationFoods.json'), 'utf-8');
  const { FoundationFoods } = JSON.parse(raw) as { FoundationFoods: (UsdaFood | null)[] };

  // The USDA export contains null placeholder entries; skip them.
  const foods = FoundationFoods.filter(
    (f): f is UsdaFood => f != null && Array.isArray(f.foodNutrients),
  );

  const rows = foods.map((food) => ({
    source: 'usda' as const,
    sourceId: String(food.fdcId),
    name: food.description,
    nameNormalized: normalizeName(food.description),
    caloriesPer100g: String(calorieAmount(food)),
    proteinGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.protein)),
    carbsGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.carbs)),
    fatGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.fat)),
    category: null,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(foodItems).values(rows.slice(i, i + BATCH_SIZE));
    console.log(`insertados ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
