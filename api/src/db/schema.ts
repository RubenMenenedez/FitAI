import {
  pgTable, uuid, text, numeric, integer, timestamp, date, pgEnum,
} from 'drizzle-orm/pg-core';

export const sexEnum = pgEnum('sex', ['male', 'female']);
export const activityLevelEnum = pgEnum('activity_level', [
  'sedentary', 'light', 'moderate', 'active', 'very_active',
]);
export const goalEnum = pgEnum('goal', ['lose_fat', 'maintain', 'gain_muscle']);
export const mealsPerDayEnum = pgEnum('meals_per_day', ['3', '5_6']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['free', 'monthly', 'annual']);
export const bmiCategoryEnum = pgEnum('bmi_category', ['underweight', 'normal', 'overweight', 'obese']);
export const foodSourceEnum = pgEnum('food_source', ['usda', 'off']);
export const recipeSourceEnum = pgEnum('recipe_source', ['themealdb', 'ai_generated']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // igual al id de neon_auth.users_sync
  email: text('email').unique().notNull(),
  name: text('name'),
  sex: sexEnum('sex'),
  birthDate: date('birth_date'),
  heightCm: numeric('height_cm'),
  activityLevel: activityLevelEnum('activity_level'),
  goal: goalEnum('goal'),
  mealsPerDay: mealsPerDayEnum('meals_per_day').default('3'),
  dailyCalorieTarget: numeric('daily_calorie_target'),
  dailyProteinTargetG: numeric('daily_protein_target_g'),
  dailyCarbsTargetG: numeric('daily_carbs_target_g'),
  dailyFatTargetG: numeric('daily_fat_target_g'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const weighIns = pgTable('weigh_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weightKg: numeric('weight_kg').notNull(),
  bmi: numeric('bmi').notNull(),
  bmiCategory: bmiCategoryEnum('bmi_category').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
});

export const foodItems = pgTable('food_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: foodSourceEnum('source').notNull(),
  sourceId: text('source_id').notNull(),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized').notNull(),
  caloriesPer100g: numeric('calories_per_100g').notNull(),
  proteinGPer100g: numeric('protein_g_per_100g').notNull(),
  carbsGPer100g: numeric('carbs_g_per_100g').notNull(),
  fatGPer100g: numeric('fat_g_per_100g').notNull(),
  category: text('category'),
});

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: recipeSourceEnum('source').notNull(),
  title: text('title').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  tags: text('tags').array().default([]),
  baseServings: integer('base_servings').notNull(),
  instructions: text('instructions'),
  imageUrl: text('image_url'),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  foodItemId: uuid('food_item_id').references(() => foodItems.id).notNull(),
  baseGrams: numeric('base_grams').notNull(),
});

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weekStartDate: date('week_start_date').notNull(),
});

export const mealPlanItems = pgTable('meal_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealPlanId: uuid('meal_plan_id').references(() => mealPlans.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  slotOrder: integer('slot_order').notNull(), // desambigua múltiples snacks el mismo día
  mealType: mealTypeEnum('meal_type').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  scaleFactor: numeric('scale_factor').notNull(),
  targetCalories: numeric('target_calories').notNull(),
});
