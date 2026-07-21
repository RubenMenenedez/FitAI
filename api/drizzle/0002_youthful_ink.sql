CREATE TYPE "public"."supermarket" AS ENUM('walmart', 'costco');--> statement-breakpoint
CREATE TABLE "supermarket_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_item_id" uuid NOT NULL,
	"supermarket" "supermarket" NOT NULL,
	"product_name_raw" text NOT NULL,
	"price" numeric NOT NULL,
	"package_size_g" numeric NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "supermarket_prices" ADD CONSTRAINT "supermarket_prices_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE no action ON UPDATE no action;