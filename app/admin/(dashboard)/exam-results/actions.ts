"use server";

import { db } from "@/db";
import {
  examSubmissions,
  exams,
  internships,
  users,
  examSubmissionAnswers,
  examQuestions,
} from "@/db/schema";
import { eq, desc, ilike, or, and, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/* =========================================================
   TYPES
========================================================= */

export type ExamResult = {
  id: string;

  examId: string;
  examTitle: string;
  examType: "pre" | "end";
  examTotalScore: number;
  examPassingScore: number;

  internshipId: string;
  internshipName: string;

  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;

  attemptNumber: number;
  status: "started" | "submitted" | "evaluated";
  startedAt: Date;
  submittedAt: Date | null;

  score: number | null;
  totalScore: number | null;
  percentage: string | null;
  passed: boolean | null;
  timeTaken: number | null;

  createdAt: Date;
};

/* =========================================================
   GET EXAM RESULTS (paginated + filtered)
========================================================= */

export async function getExamResults({
  search = "",
  examId,
  internshipId,
  status = "all",
  passed = "all",
  page = 1,
  limit = 15,
}: {
  search?: string;
  examId?: string;
  internshipId?: string;
  status?: "all" | "started" | "submitted" | "evaluated";
  passed?: "all" | "passed" | "failed";
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];

  // search
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(users.name, q),
        ilike(users.email, q),
        ilike(exams.title, q),
        ilike(internships.name, q)
      )!
    );
  }

  // filters
  if (examId && examId !== "all") {
    conditions.push(eq(examSubmissions.examId, examId));
  }
  if (internshipId && internshipId !== "all") {
    conditions.push(eq(exams.internshipId, internshipId));
  }
  if (status !== "all") {
    conditions.push(
      eq(
        examSubmissions.status,
        status as "started" | "submitted" | "evaluated"
      )
    );
  }
  if (passed === "passed") {
    conditions.push(eq(examSubmissions.passed, true));
  } else if (passed === "failed") {
    conditions.push(eq(examSubmissions.passed, false));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: examSubmissions.id,

        examId: exams.id,
        examTitle: exams.title,
        examType: exams.type,
        examTotalScore: exams.totalScore,
        examPassingScore: exams.passingScore,

        internshipId: internships.id,
        internshipName: internships.name,

        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,

        attemptNumber: examSubmissions.attemptNumber,
        status: examSubmissions.status,
        startedAt: examSubmissions.startedAt,
        submittedAt: examSubmissions.submittedAt,
        score: examSubmissions.score,
        totalScore: examSubmissions.totalScore,
        percentage: examSubmissions.percentage,
        passed: examSubmissions.passed,
        timeTaken: examSubmissions.timeTaken,
        createdAt: examSubmissions.createdAt,
      })
      .from(examSubmissions)
      .innerJoin(exams, eq(exams.id, examSubmissions.examId))
      .innerJoin(internships, eq(internships.id, exams.internshipId))
      .innerJoin(users, eq(users.id, examSubmissions.userId))
      .where(whereClause)
      .orderBy(desc(examSubmissions.submittedAt), desc(examSubmissions.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(examSubmissions)
      .innerJoin(exams, eq(exams.id, examSubmissions.examId))
      .innerJoin(internships, eq(internships.id, exams.internshipId))
      .innerJoin(users, eq(users.id, examSubmissions.userId))
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows as ExamResult[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/* =========================================================
   STATS
========================================================= */

export async function getExamResultStats() {
  const [allRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(examSubmissions);

  const [evaluatedRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(examSubmissions)
    .where(eq(examSubmissions.status, "evaluated"));

  const [passedRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(examSubmissions)
    .where(eq(examSubmissions.passed, true));

  const [failedRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(examSubmissions)
    .where(eq(examSubmissions.passed, false));

  const [avgRow] = await db
    .select({
      avg: sql<number>`AVG(${examSubmissions.percentage})`,
    })
    .from(examSubmissions)
    .where(eq(examSubmissions.status, "evaluated"));

  return {
    all: Number(allRow?.c ?? 0),
    evaluated: Number(evaluatedRow?.c ?? 0),
    passed: Number(passedRow?.c ?? 0),
    failed: Number(failedRow?.c ?? 0),
    avgPercentage: Number(avgRow?.avg ?? 0),
  };
}

/* =========================================================
   GET INTERNSHIP OPTIONS
========================================================= */

export async function getInternshipOptions() {
  return db
    .select({ id: internships.id, name: internships.name })
    .from(internships)
    .orderBy(internships.name);
}

/* =========================================================
   GET EXAM OPTIONS (optionally by internship)
========================================================= */

export async function getExamOptions(internshipId?: string) {
  const query = db
    .select({
      id: exams.id,
      title: exams.title,
      type: exams.type,
    })
    .from(exams);

  if (internshipId && internshipId !== "all") {
    return query
      .where(eq(exams.internshipId, internshipId))
      .orderBy(exams.title);
  }

  return query.orderBy(exams.title);
}

/* =========================================================
   GET FULL RESULT (with answers for drawer)
========================================================= */

export async function getExamResultDetail(submissionId: string) {
  const [submission] = await db
    .select({
      id: examSubmissions.id,
      attemptNumber: examSubmissions.attemptNumber,
      status: examSubmissions.status,
      startedAt: examSubmissions.startedAt,
      submittedAt: examSubmissions.submittedAt,
      score: examSubmissions.score,
      totalScore: examSubmissions.totalScore,
      percentage: examSubmissions.percentage,
      passed: examSubmissions.passed,
      timeTaken: examSubmissions.timeTaken,

      examId: exams.id,
      examTitle: exams.title,
      examType: exams.type,
      examTotalScore: exams.totalScore,
      examPassingScore: exams.passingScore,
      examDuration: exams.duration,

      internshipId: internships.id,
      internshipName: internships.name,

      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(examSubmissions)
    .innerJoin(exams, eq(exams.id, examSubmissions.examId))
    .innerJoin(internships, eq(internships.id, exams.internshipId))
    .innerJoin(users, eq(users.id, examSubmissions.userId))
    .where(eq(examSubmissions.id, submissionId))
    .limit(1);

  if (!submission) return null;

  // fetch answers with question
  const answers = await db
    .select({
      id: examSubmissionAnswers.id,
      questionId: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      correctOption: examQuestions.correctOption,
      selectedOption: examSubmissionAnswers.selectedOption,
      isCorrect: examSubmissionAnswers.isCorrect,
      marksObtained: examSubmissionAnswers.marksObtained,
      marks: examQuestions.marks,
      explanation: examQuestions.explanation,
    })
    .from(examSubmissionAnswers)
    .innerJoin(
      examQuestions,
      eq(examQuestions.id, examSubmissionAnswers.questionId)
    )
    .where(eq(examSubmissionAnswers.submissionId, submissionId))
    .orderBy(examQuestions.order);

  return { submission, answers };
}

/* =========================================================
   MANUAL EVALUATE (optional — if you need to override)
========================================================= */

export async function reEvaluateSubmission(submissionId: string) {
  try {
    const [submission] = await db
      .select()
      .from(examSubmissions)
      .where(eq(examSubmissions.id, submissionId))
      .limit(1);

    if (!submission) return { success: false, error: "Not found" };

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, submission.examId))
      .limit(1);

    if (!exam) return { success: false, error: "Exam not found" };

    // fetch all answers
    const answers = await db
      .select({
        id: examSubmissionAnswers.id,
        selectedOption: examSubmissionAnswers.selectedOption,
        questionId: examSubmissionAnswers.questionId,
      })
      .from(examSubmissionAnswers)
      .where(eq(examSubmissionAnswers.submissionId, submissionId));

    if (answers.length === 0)
      return { success: false, error: "No answers found" };

    // fetch questions for correct options
    const questionIds = answers.map((a) => a.questionId);
    const questions = await db
      .select({
        id: examQuestions.id,
        correctOption: examQuestions.correctOption,
        marks: examQuestions.marks,
      })
      .from(examQuestions)
      .where(inArray(examQuestions.id, questionIds));

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    let totalScore = 0;

    for (const a of answers) {
      const q = questionMap.get(a.questionId);
      if (!q) continue;
      totalScore += q.marks;
      if (a.selectedOption === q.correctOption) score += q.marks;
    }

    const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
    const passed = score >= exam.passingScore;

    await db
      .update(examSubmissions)
      .set({
        status: "evaluated",
        score,
        totalScore,
        percentage: percentage.toFixed(2),
        passed,
        submittedAt: submission.submittedAt ?? new Date(),
      })
      .where(eq(examSubmissions.id, submissionId));

    revalidatePath("/admin/exam-results");
    return { success: true };
  } catch (err) {
    console.error("reEvaluateSubmission", err);
    return { success: false, error: "Failed to evaluate" };
  }
}

/* =========================================================
   DELETE SUBMISSION
========================================================= */

export async function deleteExamResult(submissionId: string) {
  try {
    await db
      .delete(examSubmissions)
      .where(eq(examSubmissions.id, submissionId));
    revalidatePath("/admin/exam-results");
    return { success: true };
  } catch (err) {
    console.error("deleteExamResult", err);
    return { success: false, error: "Failed to delete" };
  }
}