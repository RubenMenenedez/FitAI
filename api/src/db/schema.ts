import {
  pgTable, uuid, text, numeric, integer, timestamp, date, pgEnum, primaryKey,
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
export const goalTypeEnum = pgEnum('goal_type', ['target_weight', 'daily_calories', 'daily_protein', 'weekly_workouts', 'water_intake', 'custom']);
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'abandoned']);
export const groupVisibilityEnum = pgEnum('group_visibility', ['private', 'public']);
export const dietModeEnum = pgEnum('diet_mode', ['standard', 'keto', 'high_protein', 'vegetarian_vegan']);
export const pregnancyStatusEnum = pgEnum('pregnancy_status', ['none', 'pregnant', 'breastfeeding']);
export const stressLevelEnum = pgEnum('stress_level', ['low', 'medium', 'high']);

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
  dietMode: dietModeEnum('diet_mode').default('standard'),
  bodyFatPercent: numeric('body_fat_percent'),
  targetWeightKg: numeric('target_weight_kg'),
  weeklyRateKg: numeric('weekly_rate_kg'),
  trainingDaysPerWeek: integer('training_days_per_week'),
  pregnancyStatus: pregnancyStatusEnum('pregnancy_status').default('none'),
  allergies: text('allergies').array().default([]),
  medicalConditions: text('medical_conditions').array().default([]),
  sleepHours: numeric('sleep_hours'),
  stressLevel: stressLevelEnum('stress_level'),
  waterIntakeMl: numeric('water_intake_ml'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const weighIns = pgTable('weigh_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weightKg: numeric('weight_kg').notNull(),
  bmi: numeric('bmi').notNull(),
  bmiCategory: bmiCategoryEnum('bmi_category').notNull(),
  waistCm: numeric('waist_cm'),
  bodyFatPercent: numeric('body_fat_percent'),
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

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  goalType: goalTypeEnum('goal_type').notNull(),
  targetValue: numeric('target_value').notNull(),
  currentValue: numeric('current_value').default('0'),
  targetDate: date('target_date'),
  status: goalStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const streaks = pgTable('streaks', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  currentStreakDays: integer('current_streak_days').default(0),
  longestStreakDays: integer('longest_streak_days').default(0),
  lastLoggedDate: date('last_logged_date'),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  badgeCode: text('badge_code').notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  visibility: groupVisibilityEnum('visibility').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  inviteCode: text('invite_code').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.groupId, t.userId] }) }));

export const groupPosts = pgTable('group_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  photoAnalysisId: uuid('photo_analysis_id'), // FK to photo_analyses added in Fase 2
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupReactions = pgTable('group_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupPostId: uuid('group_post_id').references(() => groupPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const progressPhotos = pgTable('progress_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  photoUrl: text('photo_url').notNull(),
  weightAtTimeKg: numeric('weight_at_time_kg'),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow(),
});

export const supermarketEnum = pgEnum('supermarket', ['walmart', 'costco']);

export const supermarketPrices = pgTable('supermarket_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodItemId: uuid('food_item_id').references(() => foodItems.id).notNull(),
  supermarket: supermarketEnum('supermarket').notNull(),
  productNameRaw: text('product_name_raw').notNull(),
  price: numeric('price').notNull(),
  packageSizeG: numeric('package_size_g').notNull(),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
});
