CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."bmi_category" AS ENUM('underweight', 'normal', 'overweight', 'obese');--> statement-breakpoint
CREATE TYPE "public"."food_source" AS ENUM('usda', 'off');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('lose_fat', 'maintain', 'gain_muscle');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."meals_per_day" AS ENUM('3', '5_6');--> statement-breakpoint
CREATE TYPE "public"."recipe_source" AS ENUM('themealdb', 'ai_generated');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('free', 'monthly', 'annual');--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "food_source" NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"calories_per_100g" numeric NOT NULL,
	"protein_g_per_100g" numeric NOT NULL,
	"carbs_g_per_100g" numeric NOT NULL,
	"fat_g_per_100g" numeric NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "meal_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_plan_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot_order" integer NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"recipe_id" uuid NOT NULL,
	"scale_factor" numeric NOT NULL,
	"target_calories" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"food_item_id" uuid NOT NULL,
	"base_grams" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "recipe_source" NOT NULL,
	"title" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"tags" text[] DEFAULT '{}',
	"base_servings" integer NOT NULL,
	"instructions" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"sex" "sex",
	"birth_date" date,
	"height_cm" numeric,
	"activity_level" "activity_level",
	"goal" "goal",
	"meals_per_day" "meals_per_day" DEFAULT '3',
	"daily_calorie_target" numeric,
	"daily_protein_target_g" numeric,
	"daily_carbs_target_g" numeric,
	"daily_fat_target_g" numeric,
	"subscription_status" "subscription_status" DEFAULT 'free',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weigh_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight_kg" numeric NOT NULL,
	"bmi" numeric NOT NULL,
	"bmi_category" "bmi_category" NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weigh_ins" ADD CONSTRAINT "weigh_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;