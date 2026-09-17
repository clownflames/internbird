CREATE TYPE "notification_type" AS ENUM('post_like', 'post_comment', 'comment_reply', 'comment_like', 'follow', 'connection_request', 'connection_accepted', 'internship_registered', 'exam_published', 'certificate_issued', 'offer_letter_issued', 'mention', 'system');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"actor_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"entity_id" uuid,
	"entity_type" varchar(50),
	"link" varchar(500),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notifications" ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notification_created_idx" ON "notifications" ("created_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE;