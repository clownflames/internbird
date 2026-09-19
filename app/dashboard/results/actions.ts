"use server";

import { db } from "@/db";
import {
  examSubmissions,
  exams,
  examQuestions,
  examSubmissionAnswers,
  internships,
} from "@/db/schema";
import { eq, desc, and, inArray, asc } from "drizzle-orm";
import { getSession } from "@/auth";

/* =========================================================
   TYPES
========================================================= */
export type ResultListItem = {
  submissionId: string;
  examId: string;
  examTitle: string | null;              // ✅ allow null
  examType: "pre" | "end" | null;        // ✅ allow null
  internshipId: string | null;           // ✅ allow null
  internshipName: string | null;
  attemptNumber: number;
  status: "started" | "submitted" | "evaluated";
  score: number | null;
  totalScore: number | null;
  percentage: string | null;
  passed: boolean | null;
  timeTaken: number | null;
  submittedAt: Date | null;
  startedAt: Date;
};

export type ResultDetail = ResultListItem & {
  duration: number | null;               // ✅ exams.duration nullable ho sakta hai
  passingScore: number | null;           // ✅ same
  examDescription: string | null;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctOption: number;
    selectedOption: number | null;
    isCorrect: boolean | null;
    marksObtained: number;
    marks: number;
    explanation: string | null;
  }[];
};

/* =========================================================
   GET MY RESULTS (list)
========================================================= */

export async function getMyResults() {
  const session = await getSession();
  if (!session?.user)
    return { success: false, error: "Unauthorized", data: [] as ResultListItem[] };

  const userId = (session.user as { id?: string }).id;
  if (!userId)
    return { success: false, error: "Unauthorized", data: [] as ResultListItem[] };

  const rows = await db
    .select({
      submissionId: examSubmissions.id,
      examId: examSubmissions.examId,
      examTitle: exams.title,
      examType: exams.type,
      internshipId: exams.internshipId,
      internshipName: internships.name,
      attemptNumber: examSubmissions.attemptNumber,
      status: examSubmissions.status,
      score: examSubmissions.score,
      totalScore: examSubmissions.totalScore,
      percentage: examSubmissions.percentage,
      passed: examSubmissions.passed,
      timeTaken: examSubmissions.timeTaken,
      submittedAt: examSubmissions.submittedAt,
      startedAt: examSubmissions.startedAt,
    })
    .from(examSubmissions)
    .leftJoin(exams, eq(examSubmissions.examId, exams.id))
    .leftJoin(internships, eq(exams.internshipId, internships.id))
    .where(
      and(
        eq(examSubmissions.userId, userId),
        inArray(examSubmissions.status, ["submitted", "evaluated"])
      )
    )
    .orderBy(desc(examSubmissions.submittedAt));

  return { success: true, data: rows as ResultListItem[] };
}

/* =========================================================
   GET RESULT DETAIL
========================================================= */

export async function getMyResultDetail(submissionId: string) {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  // 1) get submission + exam
  const [row] = await db
    .select({
      submissionId: examSubmissions.id,
      examId: examSubmissions.examId,
      attemptNumber: examSubmissions.attemptNumber,
      status: examSubmissions.status,
      score: examSubmissions.score,
      totalScore: examSubmissions.totalScore,
      percentage: examSubmissions.percentage,
      passed: examSubmissions.passed,
      timeTaken: examSubmissions.timeTaken,
      submittedAt: examSubmissions.submittedAt,
      startedAt: examSubmissions.startedAt,

      examTitle: exams.title,
      examDescription: exams.description,
      examType: exams.type,
      duration: exams.duration,
      passingScore: exams.passingScore,

      internshipId: exams.internshipId,
      internshipName: internships.name,
    })
    .from(examSubmissions)
    .leftJoin(exams, eq(examSubmissions.examId, exams.id))
    .leftJoin(internships, eq(exams.internshipId, internships.id))
    .where(
      and(
        eq(examSubmissions.id, submissionId),
        eq(examSubmissions.userId, userId)
      )
    )
    .limit(1);

  if (!row) return { success: false, error: "Not found" };

  // 2) get questions + user's answers
  const questions = await db
    .select({
      id: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      correctOption: examQuestions.correctOption,
      marks: examQuestions.marks,
      explanation: examQuestions.explanation,
      order: examQuestions.order,

      selectedOption: examSubmissionAnswers.selectedOption,
      isCorrect: examSubmissionAnswers.isCorrect,
      marksObtained: examSubmissionAnswers.marksObtained,
    })
    .from(examQuestions)
    .leftJoin(
      examSubmissionAnswers,
      and(
        eq(examSubmissionAnswers.questionId, examQuestions.id),
        eq(examSubmissionAnswers.submissionId, submissionId)
      )
    )
    .where(eq(examQuestions.examId, row.examId))
    .orderBy(asc(examQuestions.order), asc(examQuestions.createdAt));

  const detail: ResultDetail = {
    ...row,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctOption: q.correctOption,
      selectedOption: q.selectedOption ?? null,
      isCorrect: q.isCorrect ?? null,
      marksObtained: q.marksObtained ?? 0,
      marks: q.marks,
      explanation: q.explanation,
    })),
  };

  return { success: true, data: detail };
}