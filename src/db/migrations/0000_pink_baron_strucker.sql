CREATE TYPE "public"."lift" AS ENUM('squat', 'deadlift', 'ohp', 'pullup', 'bench');--> statement-breakpoint
CREATE TYPE "public"."run_type" AS ENUM('easy', 'long_easy', 'intervals', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."skill_key" AS ENUM('rolls_cartwheel', 'handstand_2h', 'handstand_pushup', 'pistol_squat', 'lsit_planche', 'front_split', 'middle_split', 'windmill', 'backflip', 'front_flip', 'one_arm_handstand');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('not_started', 'working', 'achieved');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "body_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"waist_cm" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lift_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"lift" "lift" NOT NULL,
	"weight_kg" numeric(6, 2) NOT NULL,
	"reps" integer NOT NULL,
	"rpe" numeric(3, 1),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobility_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"front_split_gap_cm" numeric(5, 1),
	"middle_split_gap_cm" numeric(5, 1),
	"wall_hs_hold_s" integer,
	"freestanding_hs_hold_s" integer,
	"lsit_hold_s" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "running_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "run_type" NOT NULL,
	"distance_km" numeric(6, 2) NOT NULL,
	"duration_min" numeric(6, 1) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_key" "skill_key" NOT NULL,
	"status" "skill_status" DEFAULT 'not_started' NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_checkpoints_user_skill_unique" UNIQUE("user_id","skill_key")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_weight_kg" numeric(5, 2) DEFAULT '80' NOT NULL,
	"current_unit" text DEFAULT 'kg' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "body_stats_user_date_idx" ON "body_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "lift_entries_user_date_idx" ON "lift_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "lift_entries_user_lift_idx" ON "lift_entries" USING btree ("user_id","lift");--> statement-breakpoint
CREATE INDEX "mobility_stats_user_date_idx" ON "mobility_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "running_sessions_user_date_idx" ON "running_sessions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "skill_checkpoints_user_idx" ON "skill_checkpoints" USING btree ("user_id");