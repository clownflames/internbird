"use server";

import { db } from "@/db";
import { projects, internships, exams } from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION
========================================================= */

const resourceSchema = z.object({
  title: z.string().min(1, "Resource title is required"),
  url: z.string().url("Must be a valid URL"),
});

const attachmentSchema = z.object({
  name: z.string().min(1, "Attachment name is required"),
  url: z.string().url("Must be a valid URL"),
});

const projectSchema = z
  .object({
    internshipId: z.string().uuid("Please select an internship"),
    examId: z
      .string()
      .uuid()
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((v) => (v === "" || v === undefined ? null : v)),
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional().nullable(),
    image: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    requirements: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    totalScore: z.coerce.number().int().min(1, "Total score required"),
    passingScore: z.coerce.number().int().min(0, "Passing score required"),
    durationDays: z.coerce
      .number()
      .int()
      .min(1, "Duration must be at least 1 day"),
    resources: z.array(resourceSchema).default([]),
    attachments: z.array(attachmentSchema).default([]),
    order: z.coerce.number().int().default(0),
    isPublished: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.passingScore <= d.totalScore, {
    message: "Passing score cannot exceed total score",
    path: ["passingScore"],
  });

export type ProjectInput = z.infer<typeof projectSchema>;

/* =========================================================
   GET ALL (paginated)
========================================================= */

export async function getProjects({
  search = "",
  internshipId,
  page = 1,
  limit = 10,
}: {
  search?: string;
  internshipId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(ilike(projects.title, q), ilike(projects.description, q))!
    );
  }

  if (internshipId) {
    conditions.push(eq(projects.internshipId, internshipId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: projects.id,
        internshipId: projects.internshipId,
        internshipName: internships.name,
        examId: projects.examId,
        examTitle: exams.title,
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
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(internships, eq(internships.id, projects.internshipId))
      .leftJoin(exams, eq(exams.id, projects.examId))
      .where(whereClause)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* =========================================================
   GET INTERNSHIP OPTIONS
========================================================= */

export async function getInternshipOptions() {
  return db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .where(eq(internships.isActive, true))
    .orderBy(internships.name);
}

/* =========================================================
   GET EXAM OPTIONS FOR AN INTERNSHIP
========================================================= */

export async function getExamOptions(internshipId: string) {
  if (!internshipId) return [];

  return db
    .select({
      id: exams.id,
      title: exams.title,
      type: exams.type,
      internshipId: exams.internshipId,
    })
    .from(exams)
    .where(eq(exams.internshipId, internshipId))
    .orderBy(exams.title);
}

/* =========================================================
   CREATE
========================================================= */

export async function createProject(input: ProjectInput) {
  try {
    const parsed = projectSchema.parse(input);

    const [created] = await db
      .insert(projects)
      .values({
        internshipId: parsed.internshipId,
        examId: parsed.examId ?? null,
        title: parsed.title,
        description: parsed.description ?? null,
        image: parsed.image || null,
        requirements: parsed.requirements,
        skills: parsed.skills,
        totalScore: parsed.totalScore,
        passingScore: parsed.passingScore,
        durationDays: parsed.durationDays,
        resources: parsed.resources,
        attachments: parsed.attachments,
        order: parsed.order,
        isPublished: parsed.isPublished,
        isActive: parsed.isActive,
      })
      .returning();

    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true, data: created };
  } catch (error) {
    console.error("createProject error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create project" };
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateProject(id: string, input: ProjectInput) {
  try {
    const parsed = projectSchema.parse(input);

    const [updated] = await db
      .update(projects)
      .set({
        internshipId: parsed.internshipId,
        examId: parsed.examId ?? null,
        title: parsed.title,
        description: parsed.description ?? null,
        image: parsed.image || null,
        requirements: parsed.requirements,
        skills: parsed.skills,
        totalScore: parsed.totalScore,
        passingScore: parsed.passingScore,
        durationDays: parsed.durationDays,
        resources: parsed.resources,
        attachments: parsed.attachments,
        order: parsed.order,
        isPublished: parsed.isPublished,
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateProject error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update project" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteProject(id: string) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("deleteProject error:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

/* =========================================================
   TOGGLES
========================================================= */

export async function toggleProjectActive(id: string, isActive: boolean) {
  try {
    await db
      .update(projects)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(projects.id, id));
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status" };
  }
}

export async function toggleProjectPublished(
  id: string,
  isPublished: boolean
) {
  try {
    await db
      .update(projects)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(projects.id, id));
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update publish status" };
  }
}