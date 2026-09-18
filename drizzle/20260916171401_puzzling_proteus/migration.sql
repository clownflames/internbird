CREATE TYPE "document_status" AS ENUM('draft', 'issued', 'revoked');--> statement-breakpoint
CREATE TYPE "exam_submission_status" AS ENUM('started', 'submitted', 'evaluated');--> statement-breakpoint
CREATE TYPE "exam_type" AS ENUM('pre', 'end');--> statement-breakpoint
CREATE TYPE "internship_mode" AS ENUM('remote', 'onsite', 'hybrid');--> statement-breakpoint
CREATE TYPE "offer_letter_status" AS ENUM('draft', 'issued', 'accepted', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "payment_provider" AS ENUM('razorpay', 'stripe', 'cashfree', 'other');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('pending', 'processing', 'success', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "post_media_type" AS ENUM('image', 'video', 'text', 'mixed');--> statement-breakpoint
CREATE TYPE "post_visibility" AS ENUM('public', 'connections', 'private');--> statement-breakpoint
CREATE TYPE "registration_status" AS ENUM('pending', 'active', 'completed', 'cancelled', 'rejected');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"certificate_number" varchar(150) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"internship_name" varchar(255) NOT NULL,
	"position" varchar(200),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"grade" varchar(50),
	"score" numeric(6,2),
	"description" text,
	"verification_code" varchar(100) NOT NULL UNIQUE,
	"document_url" text,
	"status" "document_status" DEFAULT 'draft'::"document_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"exam_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option" integer NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_submission_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option" integer,
	"is_correct" boolean,
	"marks_obtained" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "exam_submission_status" DEFAULT 'started'::"exam_submission_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score" integer,
	"total_score" integer,
	"percentage" numeric(5,2),
	"passed" boolean,
	"time_taken" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"internship_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" "exam_type" NOT NULL,
	"duration" integer NOT NULL,
	"total_score" integer NOT NULL,
	"passing_score" integer NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internship_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"university" varchar(255) NOT NULL,
	"college_name" varchar(255) NOT NULL,
	"branch" varchar(150) NOT NULL,
	"degree" varchar(150) NOT NULL,
	"academic_year" varchar(50),
	"semester" integer,
	"passing_year" integer,
	"address" text,
	"about_user" text,
	"status" "registration_status" DEFAULT 'pending'::"registration_status" NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(200) NOT NULL,
	"description" text,
	"image" text,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"qualifications" jsonb DEFAULT '[]' NOT NULL,
	"duration" varchar(100),
	"mode" "internship_mode" DEFAULT 'remote'::"internship_mode" NOT NULL,
	"location" varchar(255),
	"registration_open" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"internship_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"image" text,
	"what_you_learn" jsonb DEFAULT '[]' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"lor_number" varchar(150) NOT NULL UNIQUE,
	"student_name" varchar(255) NOT NULL,
	"university" varchar(255),
	"college_name" varchar(255),
	"degree" varchar(150),
	"branch" varchar(150),
	"position" varchar(200),
	"internship_name" varchar(255),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"performance" text,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"achievements" jsonb DEFAULT '[]' NOT NULL,
	"recommendation_text" text NOT NULL,
	"recommender_name" varchar(255) NOT NULL,
	"recommender_designation" varchar(200),
	"recommender_email" varchar(255),
	"company_name" varchar(255),
	"company_logo" text,
	"signature_url" text,
	"document_url" text,
	"verification_code" varchar(100) NOT NULL UNIQUE,
	"status" "document_status" DEFAULT 'draft'::"document_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"offer_number" varchar(100) NOT NULL UNIQUE,
	"position" varchar(200) NOT NULL,
	"department" varchar(200),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"stipend" numeric(12,2),
	"stipend_currency" varchar(10) DEFAULT 'INR',
	"terms" text,
	"document_url" text,
	"status" "offer_letter_status" DEFAULT 'draft'::"offer_letter_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"registration_id" uuid,
	"internship_id" uuid,
	"provider" "payment_provider" NOT NULL,
	"provider_order_id" varchar(255),
	"provider_payment_id" varchar(255),
	"provider_signature" text,
	"amount" numeric(12,2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"caption" text,
	"media" jsonb DEFAULT '[]' NOT NULL,
	"media_type" "post_media_type" DEFAULT 'text'::"post_media_type" NOT NULL,
	"visibility" "post_visibility" DEFAULT 'public'::"post_visibility" NOT NULL,
	"location" varchar(255),
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"phone" varchar(20),
	"password" text,
	"image" text,
	"dob" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "certificate_user_idx" ON "certificates" ("user_id");--> statement-breakpoint
CREATE INDEX "certificate_verification_idx" ON "certificates" ("verification_code");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_certificate_unique" ON "certificates" ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_user_like_unique" ON "comment_likes" ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "comment_like_comment_idx" ON "comment_likes" ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_like_user_idx" ON "comment_likes" ("user_id");--> statement-breakpoint
CREATE INDEX "question_exam_idx" ON "exam_questions" ("exam_id");--> statement-breakpoint
CREATE INDEX "question_order_idx" ON "exam_questions" ("exam_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_question_unique" ON "exam_submission_answers" ("submission_id","question_id");--> statement-breakpoint
CREATE INDEX "submission_user_idx" ON "exam_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX "submission_exam_idx" ON "exam_submissions" ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_user_attempt_unique" ON "exam_submissions" ("exam_id","user_id","attempt_number");--> statement-breakpoint
CREATE INDEX "exam_internship_idx" ON "exams" ("internship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_internship_unique" ON "internship_registrations" ("user_id","internship_id");--> statement-breakpoint
CREATE INDEX "registration_user_idx" ON "internship_registrations" ("user_id");--> statement-breakpoint
CREATE INDEX "registration_internship_idx" ON "internship_registrations" ("internship_id");--> statement-breakpoint
CREATE INDEX "registration_status_idx" ON "internship_registrations" ("status");--> statement-breakpoint
CREATE INDEX "internships_active_idx" ON "internships" ("is_active");--> statement-breakpoint
CREATE INDEX "learning_internship_idx" ON "learning_pages" ("internship_id");--> statement-breakpoint
CREATE INDEX "learning_order_idx" ON "learning_pages" ("internship_id","order");--> statement-breakpoint
CREATE INDEX "lor_user_idx" ON "lors" ("user_id");--> statement-breakpoint
CREATE INDEX "lor_verification_idx" ON "lors" ("verification_code");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_lor_unique" ON "lors" ("registration_id");--> statement-breakpoint
CREATE INDEX "offer_user_idx" ON "offer_letters" ("user_id");--> statement-breakpoint
CREATE INDEX "offer_internship_idx" ON "offer_letters" ("internship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_offer_unique" ON "offer_letters" ("registration_id");--> statement-breakpoint
CREATE INDEX "payment_user_idx" ON "payments" ("user_id");--> statement-breakpoint
CREATE INDEX "payment_registration_idx" ON "payments" ("registration_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" ("status");--> statement-breakpoint
CREATE INDEX "comment_post_idx" ON "post_comments" ("post_id");--> statement-breakpoint
CREATE INDEX "comment_user_idx" ON "post_comments" ("user_id");--> statement-breakpoint
CREATE INDEX "comment_parent_idx" ON "post_comments" ("parent_id");--> statement-breakpoint
CREATE INDEX "comment_created_idx" ON "post_comments" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "post_user_like_unique" ON "post_likes" ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "post_like_post_idx" ON "post_likes" ("post_id");--> statement-breakpoint
CREATE INDEX "post_like_user_idx" ON "post_likes" ("user_id");--> statement-breakpoint
CREATE INDEX "post_user_idx" ON "posts" ("user_id");--> statement-breakpoint
CREATE INDEX "post_created_idx" ON "posts" ("created_at");--> statement-breakpoint
CREATE INDEX "post_visibility_idx" ON "posts" ("visibility");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_registration_id_internship_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "internship_registrations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_post_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_exams_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exam_submission_answers" ADD CONSTRAINT "exam_submission_answers_submission_id_exam_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "exam_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exam_submission_answers" ADD CONSTRAINT "exam_submission_answers_question_id_exam_questions_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_exam_id_exams_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "internship_registrations" ADD CONSTRAINT "internship_registrations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "internship_registrations" ADD CONSTRAINT "internship_registrations_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_pages" ADD CONSTRAINT "learning_pages_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lors" ADD CONSTRAINT "lors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lors" ADD CONSTRAINT "lors_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lors" ADD CONSTRAINT "lors_registration_id_internship_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "internship_registrations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offer_letters" ADD CONSTRAINT "offer_letters_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offer_letters" ADD CONSTRAINT "offer_letters_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "offer_letters" ADD CONSTRAINT "offer_letters_registration_id_internship_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "internship_registrations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_internship_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "internship_registrations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_internship_id_internships_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_post_comments_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;