CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY,
	"booking_code" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"service_id" text NOT NULL,
	"appointment_date" text NOT NULL,
	"time_slot" text NOT NULL,
	"address" jsonb,
	"instructions" text DEFAULT '' NOT NULL,
	"service_price" double precision DEFAULT 0 NOT NULL,
	"additional_charges" double precision DEFAULT 0 NOT NULL,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"booking_status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'paid' NOT NULL,
	"payment_method" text DEFAULT 'demo' NOT NULL,
	"has_review" boolean DEFAULT false NOT NULL,
	"status_history" jsonb DEFAULT '[]' NOT NULL,
	"cancellation_reason" text,
	"cancelled_by" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"category_name" text NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professionals" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"service_categories" jsonb DEFAULT '[]' NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"rating" double precision DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"hourly_rate" double precision DEFAULT 0 NOT NULL,
	"location" jsonb,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"availability" jsonb DEFAULT '[]' NOT NULL,
	"is_available_today" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"professional_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"service_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY,
	"service_name" text NOT NULL,
	"category_id" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"price_type" text DEFAULT 'starting_from' NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"features" jsonb DEFAULT '[]' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"total_bookings" integer DEFAULT 0 NOT NULL,
	"avg_rating" double precision DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"phone" text DEFAULT '' NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"profile_image" text DEFAULT '' NOT NULL,
	"addresses" jsonb DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_slot_idx" ON "bookings" ("professional_id","appointment_date","time_slot") WHERE "booking_status" <> 'cancelled';--> statement-breakpoint
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;