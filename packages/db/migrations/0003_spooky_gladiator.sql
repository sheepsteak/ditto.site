ALTER TABLE "jobs" ADD COLUMN "input_kind" text DEFAULT 'url' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "input_sha256" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "input_filename" text;