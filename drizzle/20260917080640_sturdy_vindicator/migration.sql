CREATE TYPE "document_type" AS ENUM('paid', 'unpaid');--> statement-breakpoint
CREATE TYPE "internship_payment_type" AS ENUM('one_time', 'monthly');--> statement-breakpoint
CREATE TYPE "internship_pricing" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TYPE "project_status" AS ENUM('locked', 'unlocked', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TABLE "project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"registration_id" uuid,
	"exam_submission_id" uuid,
	"status" "project_status" DEFAULT 'locked'::"project_status" NOT NULL,
	"submission_url" text,
	"github_url" text,
	"live_url" text,
	"submission_files" jsonb DEFAULT '[]' NOT NULL,
	"submission_notes" text,
	"reviewed_by" uuid,
	"score" integer,
	"feedback" text,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"internship_id" uuid NOT NULL,
	"exam_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"requirements" jsonb DEFAULT '[]' NOT NULL,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"total_score" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 40 NOT NULL,
	"duration_days" integer DEFAULT 7 NOT NULL,
	"resources" jsonb DEFAULT '[]' NOT NULL,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"image" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "document_type" "document_type" DEFAULT 'unpaid'::"document_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "pricing" "internship_pricing" DEFAULT 'free'::"internship_pricing" NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "price" numeric(12,2);--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "currency" varchar(10) DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "payment_type" "internship_payment_type" DEFAULT 'one_time'::"internship_payment_type";--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "discount_price" numeric(12,2);--> statement-breakpoint
ALTER TABLE "internships" ADD COLUMN "pricing_note" text;--> statement-breakpoint
ALTER TABLE "offer_letters" ADD COLUMN "document_type" "document_type" DEFAULT 'unpaid'::"document_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" DROP COLUMN "document_url";--> statement-breakpoint
ALTER TABLE "offer_letters" DROP COLUMN "document_url";--> statement-breakpoint
CREATE INDEX "certificate_document_type_idx" ON "certificates" ("document_type");--> statement-breakpoint
CREATE INDEX "internships_pricing_idx" ON "internships" ("pricing");--> statement-breakpoint
CREATE INDEX "offer_document_type_idx" ON "offer_letters" ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_project_unique" ON "project_submissions" ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "project_submission_user_idx" ON "project_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX "project_submission_project_idx" ON "project_submissions" ("project_id");--> statement-breakpoint
CREATE INDEX "project_submission_status_idx" ON "project_submissions" ("status");--> statement-breakpoint
CREATE INDEX "project_internship_idx" ON "projects" ("internship_id");--> statement-breakpoint
CREATE INDEX "project_exam_idx" ON "projects" ("exam_id");--> statement-breakpoint
CREATE INDEX "project_active_idx" ON "projects" ("is_active");--> statement-breakpoint
CREATE INDEX "project_order_idx" ON "projects" ("internship_id","order");--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_u2rBSRw2QUZf_fkey" FOREIGN KEY ("registration_id") REFERENCES "internship_registrations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_exam_submission_id_exam_submissions_id_fkey" FOREIGN KEY ("exam_submission_id") REFERENCES "exam_submissions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_exam_id_exams_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL;