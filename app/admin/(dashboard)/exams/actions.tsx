"use server";

import { db } from "@/db";
import { exams, examQuestions, internships } from "@/db/schema";
import { eq, desc, asc, ilike, or, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/* =========================================================
   VALIDATION
========================================================= */

const examSchema = z.object({
  internshipId: z.string().uuid("Please select an internship"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().nullable(),
  type: z.enum(["pre", "end"]),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
  totalScore: z.coerce.number().int().min(1, "Total score must be at least 1"),
  passingScore: z.coerce.number().int().min(0),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  isPublished: z.boolean().default(false),
});

export type ExamInput = z.infer<typeof examSchema>;

const questionSchema = z.object({
  examId: z.string().uuid(),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctOption: z.coerce.number().int().min(0),
  marks: z.coerce.number().int().min(1).default(1),
  explanation: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
});

export type QuestionInput = z.infer<typeof questionSchema>;

/* =========================================================
   INTERNSHIP OPTIONS
========================================================= */

export async function getInternshipOptions() {
  return db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .orderBy(desc(internships.createdAt));
}

/* =========================================================
   GET EXAMS
========================================================= */

export async function getExams({
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
        ilike(exams.title, `%${search}%`),
        ilike(exams.description, `%${search}%`)
      )
    );
  }
  if (internshipId) {
    filters.push(eq(exams.internshipId, internshipId));
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: exams.id,
        internshipId: exams.internshipId,
        internshipName: internships.name,
        title: exams.title,
        description: exams.description,
        type: exams.type,
        duration: exams.duration,
        totalScore: exams.totalScore,
        passingScore: exams.passingScore,
        maxAttempts: exams.maxAttempts,
        isPublished: exams.isPublished,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
        questionCount: sql<number>`(
          select count(*) from ${examQuestions}
          where ${examQuestions.examId} = ${exams.id}
        )`,
      })
      .from(exams)
      .leftJoin(internships, eq(exams.internshipId, internships.id))
      .where(whereClause)
      .orderBy(desc(exams.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(exams)
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
   GET SINGLE EXAM
========================================================= */

export async function getExam(id: string) {
  const [row] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, id))
    .limit(1);
  return row ?? null;
}

/* =========================================================
   CREATE EXAM
========================================================= */

export async function createExam(input: ExamInput) {
  try {
    const parsed = examSchema.parse(input);

    const [created] = await db
      .insert(exams)
      .values({
        internshipId: parsed.internshipId,
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        duration: parsed.duration,
        totalScore: parsed.totalScore,
        passingScore: parsed.passingScore,
        maxAttempts: parsed.maxAttempts,
        isPublished: parsed.isPublished,
      })
      .returning();

    revalidatePath("/admin/exams");
    return { success: true, data: created };
  } catch (error) {
    console.error("createExam error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create exam" };
  }
}

/* =========================================================
   UPDATE EXAM
========================================================= */

export async function updateExam(id: string, input: ExamInput) {
  try {
    const parsed = examSchema.parse(input);

    const [updated] = await db
      .update(exams)
      .set({
        internshipId: parsed.internshipId,
        title: parsed.title,
        description: parsed.description ?? null,
        type: parsed.type,
        duration: parsed.duration,
        totalScore: parsed.totalScore,
        passingScore: parsed.passingScore,
        maxAttempts: parsed.maxAttempts,
        isPublished: parsed.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, id))
      .returning();

    revalidatePath("/admin/exams");
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateExam error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update exam" };
  }
}

/* =========================================================
   DELETE EXAM
========================================================= */

export async function deleteExam(id: string) {
  try {
    await db.delete(exams).where(eq(exams.id, id));
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("deleteExam error:", error);
    return { success: false, error: "Failed to delete exam" };
  }
}

/* =========================================================
   TOGGLE PUBLISH
========================================================= */

export async function toggleExamPublished(id: string, isPublished: boolean) {
  try {
    await db
      .update(exams)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(exams.id, id));
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update publish status" };
  }
}

/* =========================================================
   QUESTIONS
========================================================= */

export async function getExamQuestions(examId: string) {
  return db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(asc(examQuestions.order), asc(examQuestions.createdAt));
}

export async function createQuestion(input: QuestionInput) {
  try {
    const parsed = questionSchema.parse(input);

    // totalScore check against exam
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, parsed.examId))
      .limit(1);

    if (!exam) return { success: false, error: "Exam not found" };

    const existing = await db
      .select({ sum: sql<number>`coalesce(sum(${examQuestions.marks}),0)` })
      .from(examQuestions)
      .where(eq(examQuestions.examId, parsed.examId));

    const currentSum = Number(existing[0]?.sum ?? 0);
    if (currentSum + parsed.marks > exam.totalScore) {
      return {
        success: false,
        error: `Total marks (${currentSum + parsed.marks}) exceed exam total score (${exam.totalScore})`,
      };
    }

    const [created] = await db
      .insert(examQuestions)
      .values({
        examId: parsed.examId,
        question: parsed.question,
        options: parsed.options,
        correctOption: parsed.correctOption,
        marks: parsed.marks,
        explanation: parsed.explanation ?? null,
        order: parsed.order,
      })
      .returning();

    revalidatePath("/admin/exams");
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to create question" };
  }
}

export async function updateQuestion(id: string, input: QuestionInput) {
  try {
    const parsed = questionSchema.parse(input);

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, parsed.examId))
      .limit(1);

    if (!exam) return { success: false, error: "Exam not found" };

    // exclude this question from sum
    const existing = await db
      .select({ sum: sql<number>`coalesce(sum(${examQuestions.marks}),0)` })
      .from(examQuestions)
      .where(
        and(
          eq(examQuestions.examId, parsed.examId),
          sql`${examQuestions.id} <> ${id}`
        )
      );

    const currentSum = Number(existing[0]?.sum ?? 0);
    if (currentSum + parsed.marks > exam.totalScore) {
      return {
        success: false,
        error: `Total marks (${currentSum + parsed.marks}) exceed exam total score (${exam.totalScore})`,
      };
    }

    const [updated] = await db
      .update(examQuestions)
      .set({
        question: parsed.question,
        options: parsed.options,
        correctOption: parsed.correctOption,
        marks: parsed.marks,
        explanation: parsed.explanation ?? null,
        order: parsed.order,
      })
      .where(eq(examQuestions.id, id))
      .returning();

    revalidatePath("/admin/exams");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to update question" };
  }
}

export async function deleteQuestion(id: string) {
  try {
    await db.delete(examQuestions).where(eq(examQuestions.id, id));
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete question" };
  }
}