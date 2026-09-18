"use server";

import { db } from "@/db";
import { learningPages, internships } from "@/db/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION
========================================================= */

const learningPageSchema = z.object({
  internshipId: z.string().uuid("Please select an internship"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  image: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  whatYouLearn: z.array(z.string()).default([]),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

export type LearningPageInput = z.infer<typeof learningPageSchema>;

/* =========================================================
   GET ALL PAGES (search + pagination)
========================================================= */

export async function getLearningPages({
  search = "",
  internshipId = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  internshipId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const filters = [];
  if (search) {
    filters.push(
      or(
        ilike(learningPages.title, `%${search}%`),
        ilike(learningPages.description, `%${search}%`)
      )
    );
  }
  if (internshipId) {
    filters.push(eq(learningPages.internshipId, internshipId));
  }

  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: learningPages.id,
        internshipId: learningPages.internshipId,
        title: learningPages.title,
        description: learningPages.description,
        content: learningPages.content,
        image: learningPages.image,
        whatYouLearn: learningPages.whatYouLearn,
        order: learningPages.order,
        isPublished: learningPages.isPublished,
        createdAt: learningPages.createdAt,
        updatedAt: learningPages.updatedAt,
        internshipName: internships.name,
      })
      .from(learningPages)
      .leftJoin(internships, eq(learningPages.internshipId, internships.id))
      .where(whereClause)
      .orderBy(desc(learningPages.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(learningPages)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/* =========================================================
   GET SINGLE
========================================================= */

export async function getLearningPage(id: string) {
  const [row] = await db
    .select()
    .from(learningPages)
    .where(eq(learningPages.id, id))
    .limit(1);

  return row ?? null;
}

/* =========================================================
   INTERNSHIP OPTIONS (for dropdown)
========================================================= */

export async function getInternshipOptions() {
  const rows = await db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .orderBy(desc(internships.createdAt));

  return rows;
}

/* =========================================================
   CREATE
========================================================= */

export async function createLearningPage(input: LearningPageInput) {
  try {
    const parsed = learningPageSchema.parse(input);

    const [created] = await db
      .insert(learningPages)
      .values({
        internshipId: parsed.internshipId,
        title: parsed.title,
        description: parsed.description ?? null,
        content: parsed.content ?? null,
        image: parsed.image || null,
        whatYouLearn: parsed.whatYouLearn,
        order: parsed.order,
        isPublished: parsed.isPublished,
      })
      .returning();

    revalidatePath("/admin/pages");
    return { success: true, data: created };
  } catch (error) {
    console.error("createLearningPage error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create page" };
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateLearningPage(
  id: string,
  input: LearningPageInput
) {
  try {
    const parsed = learningPageSchema.parse(input);

    const [updated] = await db
      .update(learningPages)
      .set({
        internshipId: parsed.internshipId,
        title: parsed.title,
        description: parsed.description ?? null,
        content: parsed.content ?? null,
        image: parsed.image || null,
        whatYouLearn: parsed.whatYouLearn,
        order: parsed.order,
        isPublished: parsed.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(learningPages.id, id))
      .returning();

    revalidatePath("/admin/pages");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateLearningPage error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update page" };
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteLearningPage(id: string) {
  try {
    await db.delete(learningPages).where(eq(learningPages.id, id));
    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("deleteLearningPage error:", error);
    return { success: false, error: "Failed to delete page" };
  }
}

/* =========================================================
   TOGGLE PUBLISH
========================================================= */

export async function toggleLearningPagePublished(
  id: string,
  isPublished: boolean
) {
  try {
    await db
      .update(learningPages)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(learningPages.id, id));
    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update publish status" };
  }
}