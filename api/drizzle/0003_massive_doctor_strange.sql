CREATE TYPE "public"."pregnancy_status" AS ENUM('none', 'pregnant', 'breastfeeding');--> statement-breakpoint
CREATE TYPE "public"."stress_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "body_fat_percent" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "target_weight_kg" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_rate_kg" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "training_days_per_week" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pregnancy_status" "pregnancy_status" DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allergies" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "medical_conditions" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sleep_hours" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stress_level" "stress_level";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "water_intake_ml" numeric;