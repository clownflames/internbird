"use server";

import { db } from "@/db";
import {
  projects,
  projectSubmissions,
  exams,
  examSubmissions,
  internshipRegistrations,
  internships,
} from "@/db/schema";
import { auth } from "@/auth";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { generateFileKey, getPresignedUploadUrl } from "@/lib/r2";

/* =========================================================
   TYPES
========================================================= */

export type ProjectStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

export type ProjectListItem = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  requirements: string[];
  skills: string[];
  totalScore: number;
  passingScore: number;
  durationDays: number;
  resources: { title: string; url: string }[];
  attachments: { name: string; url: string }[];
  order: number;

  internshipId: string;
  internshipName: string;

  submissionId: string | null;
  status: ProjectStatus;
  startedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  deadlineAt: string | null;

  submissionUrl: string | null;
  submissionNotes: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  submissionFiles: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }[];

  score: number | null;
  feedback: string | null;
};

export type ProjectFilters = {
  status?: "all" | "pending" | "in_progress" | "completed";
  internshipId?: string;
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET USER PROJECTS
========================================================= */

export async function getUserProjects(
  filters: ProjectFilters = {}
): Promise<ProjectListItem[]> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return [];

  const { status = "all", internshipId } = filters;

  const regRows = await db
    .select({
      registrationId: internshipRegistrations.id,
      internshipId: internshipRegistrations.internshipId,
      internshipName: internships.name,
      regStatus: internshipRegistrations.status,
    })
    .from(internshipRegistrations)
    .innerJoin(
      internships,
      eq(internships.id, internshipRegistrations.internshipId)
    )
    .where(
      and(
        eq(internshipRegistrations.userId, currentUserId),
        inArray(internshipRegistrations.status, ["active", "completed"])
      )
    );

  if (regRows.length === 0) return [];

  const internshipIds = internshipId
    ? regRows
        .filter((r) => r.internshipId === internshipId)
        .map((r) => r.internshipId)
    : regRows.map((r) => r.internshipId);

  if (internshipIds.length === 0) return [];

  const projectRows = await db
    .select({
      id: projects.id,
      internshipId: projects.internshipId,
      examId: projects.examId,
      title: projects.title,
      description: projects.description,
      image: projects.image,
      requirements: projects.requirements,
      skills: projects.skills,
      totalScore: projects.totalScore,
      passingScore: projects.passingScore,
      durationDays: projects.durationDays,
      resources: projects.resources,
      attachments: projects.attachments,
      order: projects.order,
      isPublished: projects.isPublished,
      isActive: projects.isActive,
    })
    .from(projects)
    .where(
      and(
        inArray(projects.internshipId, internshipIds),
        eq(projects.isActive, true),
        eq(projects.isPublished, true)
      )
    )
    .orderBy(projects.internshipId, projects.order);

  if (projectRows.length === 0) return [];

  const projectIds = projectRows.map((p) => p.id);

  const submissionRows = await db
    .select()
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, currentUserId),
        inArray(projectSubmissions.projectId, projectIds)
      )
    );

  const submissionsByProject = new Map(
    submissionRows.map((s) => [s.projectId, s])
  );

  const endExamIds = projectRows
    .map((p) => p.examId)
    .filter((id): id is string => !!id);

  const examSubmissionMap = new Map<
    string,
    { passed: boolean; status: string }
  >();

  if (endExamIds.length > 0) {
    const examSubRows = await db
      .select({
        examId: examSubmissions.examId,
        passed: examSubmissions.passed,
        status: examSubmissions.status,
      })
      .from(examSubmissions)
      .where(
        and(
          eq(examSubmissions.userId, currentUserId),
          inArray(examSubmissions.examId, endExamIds)
        )
      );

    examSubRows.forEach((r) => {
      const prev = examSubmissionMap.get(r.examId);
      const passed = r.passed === true && r.status === "evaluated";
      if (!prev || passed) {
        examSubmissionMap.set(r.examId, {
          passed,
          status: r.status,
        });
      }
    });
  }

  const internshipNameMap = new Map(
    regRows.map((r) => [r.internshipId, r.internshipName])
  );

  let result: ProjectListItem[] = projectRows.map((p) => {
    const submission = submissionsByProject.get(p.id);

    let unlocked = true;
    if (p.examId) {
      const examResult = examSubmissionMap.get(p.examId);
      unlocked = !!examResult?.passed;
    }

    let projectStatus: ProjectStatus;
    if (submission) {
      projectStatus = submission.status as ProjectStatus;
    } else {
      projectStatus = unlocked ? "unlocked" : "locked";
    }

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      image: p.image,
      requirements: p.requirements ?? [],
      skills: p.skills ?? [],
      totalScore: p.totalScore,
      passingScore: p.passingScore,
      durationDays: p.durationDays,
      resources: p.resources ?? [],
      attachments: p.attachments ?? [],
      order: p.order,

      internshipId: p.internshipId,
      internshipName: internshipNameMap.get(p.internshipId) ?? "Internship",

      submissionId: submission?.id ?? null,
      status: projectStatus,
      startedAt: submission?.startedAt?.toISOString() ?? null,
      submittedAt: submission?.submittedAt?.toISOString() ?? null,
      reviewedAt: submission?.reviewedAt?.toISOString() ?? null,
      completedAt: submission?.completedAt?.toISOString() ?? null,
      deadlineAt: submission?.deadlineAt?.toISOString() ?? null,

      submissionUrl: submission?.submissionUrl ?? null,
      submissionNotes: submission?.submissionNotes ?? null,
      githubUrl: submission?.githubUrl ?? null,
      liveUrl: submission?.liveUrl ?? null,
      submissionFiles: submission?.submissionFiles ?? [],

      score: submission?.score ?? null,
      feedback: submission?.feedback ?? null,
    };
  });

  if (status === "pending") {
    result = result.filter(
      (p) => p.status === "unlocked" || p.status === "locked"
    );
  } else if (status === "in_progress") {
    result = result.filter(
      (p) =>
        p.status === "in_progress" ||
        p.status === "submitted" ||
        p.status === "under_review" ||
        p.status === "rejected"
    );
  } else if (status === "completed") {
    result = result.filter(
      (p) => p.status === "approved" || p.status === "completed"
    );
  }

  return result;
}

/* =========================================================
   GET SINGLE PROJECT
========================================================= */

export async function getProjectById(
  projectId: string
): Promise<ProjectListItem | null> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return null;

  const [row] = await db
    .select({
      id: projects.id,
      internshipId: projects.internshipId,
      examId: projects.examId,
      title: projects.title,
      description: projects.description,
      image: projects.image,
      requirements: projects.requirements,
      skills: projects.skills,
      totalScore: projects.totalScore,
      passingScore: projects.passingScore,
      durationDays: projects.durationDays,
      resources: projects.resources,
      attachments: projects.attachments,
      order: projects.order,
      internshipName: internships.name,
    })
    .from(projects)
    .innerJoin(internships, eq(internships.id, projects.internshipId))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!row) return null;

  const [submission] = await db
    .select()
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, currentUserId),
        eq(projectSubmissions.projectId, projectId)
      )
    )
    .limit(1);

  let unlocked = true;
  if (row.examId) {
    const [examSub] = await db
      .select({
        passed: examSubmissions.passed,
        status: examSubmissions.status,
      })
      .from(examSubmissions)
      .where(
        and(
          eq(examSubmissions.userId, currentUserId),
          eq(examSubmissions.examId, row.examId)
        )
      )
      .limit(1);

    unlocked =
      !!examSub && examSub.passed === true && examSub.status === "evaluated";
  }

  let projectStatus: ProjectStatus;
  if (submission) {
    projectStatus = submission.status as ProjectStatus;
  } else {
    projectStatus = unlocked ? "unlocked" : "locked";
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    requirements: row.requirements ?? [],
    skills: row.skills ?? [],
    totalScore: row.totalScore,
    passingScore: row.passingScore,
    durationDays: row.durationDays,
    resources: row.resources ?? [],
    attachments: row.attachments ?? [],
    order: row.order,

    internshipId: row.internshipId,
    internshipName: row.internshipName,

    submissionId: submission?.id ?? null,
    status: projectStatus,
    startedAt: submission?.startedAt?.toISOString() ?? null,
    submittedAt: submission?.submittedAt?.toISOString() ?? null,
    reviewedAt: submission?.reviewedAt?.toISOString() ?? null,
    completedAt: submission?.completedAt?.toISOString() ?? null,
    deadlineAt: submission?.deadlineAt?.toISOString() ?? null,

    submissionUrl: submission?.submissionUrl ?? null,
    submissionNotes: submission?.submissionNotes ?? null,
    githubUrl: submission?.githubUrl ?? null,
    liveUrl: submission?.liveUrl ?? null,
    submissionFiles: submission?.submissionFiles ?? [],

    score: submission?.score ?? null,
    feedback: submission?.feedback ?? null,
  };
}

/* =========================================================
   START PROJECT
   🚫 NO revalidatePath — client handles state update
========================================================= */

export async function startProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) return { success: false, error: "Project not found" };

    const [existing] = await db
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, currentUserId),
          eq(projectSubmissions.projectId, projectId)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.status === "unlocked" || existing.status === "locked") {
        const deadlineAt = new Date();
        deadlineAt.setDate(
          deadlineAt.getDate() + (project.durationDays ?? 7)
        );

        await db
          .update(projectSubmissions)
          .set({
            status: "in_progress",
            startedAt: new Date(),
            deadlineAt,
            updatedAt: new Date(),
          })
          .where(eq(projectSubmissions.id, existing.id));

        return { success: true };
      }

      return { success: false, error: "Project already started" };
    }

    const deadlineAt = new Date();
    deadlineAt.setDate(deadlineAt.getDate() + (project.durationDays ?? 7));

    await db.insert(projectSubmissions).values({
      projectId,
      userId: currentUserId,
      status: "in_progress",
      startedAt: new Date(),
      deadlineAt,
    });

    return { success: true };
  } catch (err) {
    console.error("startProject", err);
    return { success: false, error: "Failed to start project" };
  }
}

/* =========================================================
   SUBMIT PROJECT
   🚫 NO revalidatePath — client handles state update
========================================================= */

const submitSchema = z.object({
  submissionUrl: z
    .string()
    .max(2000, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .max(2000, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  liveUrl: z
    .string()
    .max(2000, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  submissionNotes: z.string().max(5000).optional().nullable(),
  submissionFiles: z
    .array(
      z.object({
        name: z.string().max(500),
        url: z.string().max(2000),
        type: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .default([]),
});

export type SubmitProjectInput = z.infer<typeof submitSchema>;

export async function submitProject(
  projectId: string,
  input: SubmitProjectInput
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  /* ---------- 🚫 SERVER-SIDE GUARDS ---------- */
  const urlFields = [
    { name: "GitHub URL", value: input.githubUrl },
    { name: "Live URL", value: input.liveUrl },
    { name: "Submission URL", value: input.submissionUrl },
  ];

  for (const f of urlFields) {
    if (!f.value) continue;

    // reject raw base64 / data URIs
    if (f.value.startsWith("data:")) {
      return {
        success: false,
        error: `${f.name} contains raw file data. Please paste only a URL, or upload the file in the Files section.`,
      };
    }

    // reject oversized strings
    if (f.value.length > 2000) {
      return {
        success: false,
        error: `${f.name} is too long. Please provide a valid URL.`,
      };
    }

    // must be http/https
    if (!/^https?:\/\//i.test(f.value)) {
      return {
        success: false,
        error: `${f.name} must start with http:// or https://`,
      };
    }
  }

  /* ---------- Validate via zod ---------- */
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  if (
    !data.githubUrl &&
    !data.liveUrl &&
    !data.submissionUrl &&
    !data.submissionNotes?.trim() &&
    data.submissionFiles.length === 0
  ) {
    return {
      success: false,
      error: "Please provide a submission link, notes, or files",
    };
  }

  try {
    const [existing] = await db
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, currentUserId),
          eq(projectSubmissions.projectId, projectId)
        )
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: "Project not started yet" };
    }

    if (
      existing.status === "submitted" ||
      existing.status === "under_review" ||
      existing.status === "approved" ||
      existing.status === "completed"
    ) {
      return { success: false, error: "Project already submitted" };
    }

    await db
      .update(projectSubmissions)
      .set({
        status: "submitted",
        submissionUrl: data.submissionUrl || null,
        githubUrl: data.githubUrl || null,
        liveUrl: data.liveUrl || null,
        submissionNotes: data.submissionNotes?.trim() || null,
        submissionFiles: data.submissionFiles,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, existing.id));

    return { success: true };
  } catch (err) {
    console.error("submitProject", err);
    return { success: false, error: "Failed to submit project" };
  }
}


/* =========================================================
   GET UPLOAD URL
========================================================= */

export async function getProjectUploadUrl(
  fileName: string,
  contentType: string
): Promise<{
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (!allowedTypes.includes(contentType)) {
    return { success: false, error: "File type not allowed" };
  }

  try {
    const key = generateFileKey(userId, fileName);
    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(
      key,
      contentType
    );
    return { success: true, uploadUrl, publicUrl, key };
  } catch (err) {
    console.error("getProjectUploadUrl", err);
    return { success: false, error: "Failed to generate upload URL" };
  }
}

/* =========================================================
   FILTER COUNTS
========================================================= */

export async function getProjectCounts(): Promise<{
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
}> {
  const allProjects = await getUserProjects();
  return {
    all: allProjects.length,
    pending: allProjects.filter(
      (p) => p.status === "unlocked" || p.status === "locked"
    ).length,
    in_progress: allProjects.filter(
      (p) =>
        p.status === "in_progress" ||
        p.status === "submitted" ||
        p.status === "under_review" ||
        p.status === "rejected"
    ).length,
    completed: allProjects.filter(
      (p) => p.status === "approved" || p.status === "completed"
    ).length,
  };
}