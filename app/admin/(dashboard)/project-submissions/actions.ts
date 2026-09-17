"use server";

import { db } from "@/db";
import {
  projectSubmissions,
  projects,
  internships,
  users,
} from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { ADMININFO } from "@/lib/admin"; // ✅ import
import {
  and,
  or,
  eq,
  desc,
  asc,
  sql,
  inArray,
  ilike,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   TYPES
========================================================= */

export type SubmissionStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

export type AdminSubmission = {
  id: string;

  projectId: string;
  projectTitle: string;
  projectImage: string | null;
  projectTotalScore: number;
  projectPassingScore: number;
  projectDurationDays: number;

  internshipId: string;
  internshipName: string;

  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userHeadline: string | null;

  status: SubmissionStatus;
  submissionUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  submissionNotes: string | null;
  submissionFiles: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }[];

  startedAt: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  reviewedAt: string | null;
  completedAt: string | null;

  reviewedBy: string | null;
  reviewedByName: string | null;
  score: number | null;
  feedback: string | null;
};

export type SubmissionFilters = {
  status?: SubmissionStatus | "all" | "pending_review";
  internshipId?: string;
  search?: string;
};

/* =========================================================
   HELPERS
========================================================= */

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authenticated");
  // no admin.id — hardcoded admin
}

/* =========================================================
   GET SUBMISSIONS (paginated + filtered)
========================================================= */

export async function getSubmissions({
  search = "",
  status = "all",
  internshipId,
  page = 1,
  limit = 15,
}: {
  search?: string;
  status?: SubmissionFilters["status"];
  internshipId?: string;
  page?: number;
  limit?: number;
} = {}) {
  await requireAdmin();

  const offset = (page - 1) * limit;
  const conditions = [];

  // 🔍 search
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(projects.title, q),
        ilike(users.name, q),
        ilike(users.email, q),
        ilike(internships.name, q)
      )!
    );
  }

  // 📌 internship filter
  if (internshipId) {
    conditions.push(eq(projects.internshipId, internshipId));
  }

  // 📌 status filter
  if (status === "pending_review") {
    conditions.push(
      inArray(projectSubmissions.status, ["submitted", "under_review"])
    );
  } else if (status !== "all") {
    conditions.push(eq(projectSubmissions.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: projectSubmissions.id,

        projectId: projects.id,
        projectTitle: projects.title,
        projectImage: projects.image,
        projectTotalScore: projects.totalScore,
        projectPassingScore: projects.passingScore,
        projectDurationDays: projects.durationDays,

        internshipId: internships.id,
        internshipName: internships.name,

        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        userHeadline: users.headline,

        status: projectSubmissions.status,
        submissionUrl: projectSubmissions.submissionUrl,
        githubUrl: projectSubmissions.githubUrl,
        liveUrl: projectSubmissions.liveUrl,
        submissionNotes: projectSubmissions.submissionNotes,
        submissionFiles: projectSubmissions.submissionFiles,

        startedAt: projectSubmissions.startedAt,
        submittedAt: projectSubmissions.submittedAt,
        deadlineAt: projectSubmissions.deadlineAt,
        reviewedAt: projectSubmissions.reviewedAt,
        completedAt: projectSubmissions.completedAt,

        reviewedBy: projectSubmissions.reviewedBy,
        score: projectSubmissions.score,
        feedback: projectSubmissions.feedback,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projects.id, projectSubmissions.projectId))
      .innerJoin(
        internships,
        eq(internships.id, projects.internshipId)
      )
      .innerJoin(users, eq(users.id, projectSubmissions.userId))
      .where(whereClause)
      .orderBy(
        // pending review first, then latest submitted
        sql`CASE WHEN ${projectSubmissions.status} IN ('submitted','under_review') THEN 0 ELSE 1 END`,
        desc(projectSubmissions.submittedAt),
        desc(projectSubmissions.createdAt)
      )
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projects.id, projectSubmissions.projectId))
      .innerJoin(
        internships,
        eq(internships.id, projects.internshipId)
      )
      .innerJoin(users, eq(users.id, projectSubmissions.userId))
      .where(whereClause),
  ]);

  // reviewer names (skip DB lookup — hardcoded admin)
  const data: AdminSubmission[] = rows.map((r) => ({
    id: r.id,

    projectId: r.projectId,
    projectTitle: r.projectTitle,
    projectImage: r.projectImage,
    projectTotalScore: r.projectTotalScore,
    projectPassingScore: r.projectPassingScore,
    projectDurationDays: r.projectDurationDays,

    internshipId: r.internshipId,
    internshipName: r.internshipName,

    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    userImage: r.userImage,
    userHeadline: r.userHeadline,

    status: r.status as SubmissionStatus,
    submissionUrl: r.submissionUrl,
    githubUrl: r.githubUrl,
    liveUrl: r.liveUrl,
    submissionNotes: r.submissionNotes,
    submissionFiles: r.submissionFiles ?? [],

    startedAt: r.startedAt?.toISOString() ?? null,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    deadlineAt: r.deadlineAt?.toISOString() ?? null,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,

    reviewedBy: r.reviewedBy,
    // if reviewedBy is set, it's the hardcoded admin username
    reviewedByName: r.reviewedBy
      ? r.reviewedBy === ADMININFO.username
        ? "Admin"
        : r.reviewedBy
      : null,
    score: r.score,
    feedback: r.feedback,
  }));

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* =========================================================
   GET FILTER COUNTS
========================================================= */

export async function getSubmissionCounts() {
  await requireAdmin();

  const [allRow, pendingRow, approvedRow, rejectedRow] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(projectSubmissions),
    db
      .select({ c: sql<number>`count(*)` })
      .from(projectSubmissions)
      .where(
        inArray(projectSubmissions.status, ["submitted", "under_review"])
      ),
    db
      .select({ c: sql<number>`count(*)` })
      .from(projectSubmissions)
      .where(
        inArray(projectSubmissions.status, ["approved", "completed"])
      ),
    db
      .select({ c: sql<number>`count(*)` })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.status, "rejected")),
  ]);

  return {
    all: Number(allRow[0]?.c ?? 0),
    pending_review: Number(pendingRow[0]?.c ?? 0),
    approved: Number(approvedRow[0]?.c ?? 0),
    rejected: Number(rejectedRow[0]?.c ?? 0),
  };
}

/* =========================================================
   GET INTERNSHIP OPTIONS
========================================================= */

export async function getInternshipOptions() {
  await requireAdmin();
  return db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .orderBy(asc(internships.name));
}

/* =========================================================
   MARK UNDER REVIEW
========================================================= */

export async function markUnderReview(submissionId: string) {
  await requireAdmin();

  try {
    const [sub] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: "Submission not found" };

    if (sub.status !== "submitted") {
      return {
        success: false,
        error: "Only 'submitted' submissions can be marked under review",
      };
    }

    await db
      .update(projectSubmissions)
      .set({
        status: "under_review",
        reviewedBy: ADMININFO.username, // ✅ "admin"
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId));

    revalidatePath("/admin/project-submissions");
    return { success: true };
  } catch (err) {
    console.error("markUnderReview", err);
    return { success: false, error: "Failed to update" };
  }
}

/* =========================================================
   APPROVE SUBMISSION
========================================================= */

const approveSchema = z.object({
  score: z.coerce
    .number()
    .int()
    .min(0, "Score can't be negative"),
  feedback: z.string().max(2000).optional().nullable(),
});

export async function approveSubmission(
  submissionId: string,
  input: z.infer<typeof approveSchema>
) {
  await requireAdmin();

  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { score, feedback } = parsed.data;

  try {
    const [sub] = await db
      .select({
        id: projectSubmissions.id,
        status: projectSubmissions.status,
        projectId: projectSubmissions.projectId,
      })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: "Submission not found" };

    if (sub.status === "approved" || sub.status === "completed") {
      return { success: false, error: "Already approved" };
    }

    const [project] = await db
      .select({
        totalScore: projects.totalScore,
        passingScore: projects.passingScore,
      })
      .from(projects)
      .where(eq(projects.id, sub.projectId))
      .limit(1);

    if (!project) return { success: false, error: "Project not found" };

    if (score > project.totalScore) {
      return {
        success: false,
        error: `Score can't exceed ${project.totalScore}`,
      };
    }

    const passed = score >= project.passingScore;

    await db
      .update(projectSubmissions)
      .set({
        status: passed ? "approved" : "rejected",
        score,
        feedback: feedback?.trim() || null,
        reviewedBy: ADMININFO.username, // ✅
        reviewedAt: new Date(),
        completedAt: passed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId));

    revalidatePath("/admin/project-submissions");
    return { success: true, passed };
  } catch (err) {
    console.error("approveSubmission", err);
    return { success: false, error: "Failed to approve" };
  }
}

/* =========================================================
   REJECT SUBMISSION
========================================================= */

const rejectSchema = z.object({
  feedback: z.string().min(5, "Please provide a reason (min 5 chars)"),
});

export async function rejectSubmission(
  submissionId: string,
  input: z.infer<typeof rejectSchema>
) {
  await requireAdmin();

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const [sub] = await db
      .select({
        id: projectSubmissions.id,
        status: projectSubmissions.status,
      })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: "Submission not found" };

    if (sub.status === "rejected") {
      return { success: false, error: "Already rejected" };
    }

    await db
      .update(projectSubmissions)
      .set({
        status: "rejected",
        feedback: parsed.data.feedback.trim(),
        score: null,
        reviewedBy: ADMININFO.username, // ✅
        reviewedAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId));

    revalidatePath("/admin/project-submissions");
    return { success: true };
  } catch (err) {
    console.error("rejectSubmission", err);
    return { success: false, error: "Failed to reject" };
  }
}

/* =========================================================
   BULK REVERT (undo) — optional
========================================================= */

export async function resetSubmission(submissionId: string) {
  await requireAdmin();

  try {
    await db
      .update(projectSubmissions)
      .set({
        status: "in_progress",
        score: null,
        feedback: null,
        reviewedBy: null,
        reviewedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId));

    revalidatePath("/admin/project-submissions");
    return { success: true };
  } catch (err) {
    console.error("resetSubmission", err);
    return { success: false, error: "Failed to reset" };
  }
}

export type FilterCounts = {
  all: number;
  pending_review: number;
  approved: number;
  rejected: number;
};