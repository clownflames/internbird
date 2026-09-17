"use server";

import { db } from "@/db";
import {
  exams,
  examQuestions,
  examSubmissions,
  examSubmissionAnswers,
  internshipRegistrations,
} from "@/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { auth } from "@/auth";

/* =========================================================
   TYPES
========================================================= */

export type ExamAttemptData = {
  examId: string;
  examTitle: string;
  examDescription: string | null;
  examType: "pre" | "end";
  duration: number; // minutes
  totalScore: number;
  passingScore: number;
  maxAttempts: number;

  submissionId: string;
  attemptNumber: number;
  startedAt: Date;
  status: "started" | "submitted" | "evaluated";

  questions: {
    id: string;
    question: string;
    options: string[];
    marks: number;
    order: number;
  }[];
};

/* =========================================================
   START EXAM
   - verifies user enrolled in the exam's internship
   - checks published + attempts left
   - creates a new submission row if none in-progress
========================================================= */

export async function startExam(examId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  /* -------- load exam -------- */
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, examId))
    .limit(1);

  if (!exam) return { success: false, error: "Exam not found" };
  if (!exam.isPublished)
    return { success: false, error: "This exam is not available" };

  /* -------- user must be enrolled -------- */
  const [reg] = await db
    .select({ id: internshipRegistrations.id, status: internshipRegistrations.status })
    .from(internshipRegistrations)
    .where(
      and(
        eq(internshipRegistrations.userId, userId),
        eq(internshipRegistrations.internshipId, exam.internshipId)
      )
    )
    .limit(1);

  if (!reg) return { success: false, error: "You are not enrolled in this internship" };
  if (reg.status !== "active" && reg.status !== "completed")
    return { success: false, error: "Your registration is not active" };

  /* -------- attempts used -------- */
  const subs = await db
    .select({
      id: examSubmissions.id,
      status: examSubmissions.status,
      attemptNumber: examSubmissions.attemptNumber,
      startedAt: examSubmissions.startedAt,
    })
    .from(examSubmissions)
    .where(
      and(
        eq(examSubmissions.userId, userId),
        eq(examSubmissions.examId, examId)
      )
    )
    .orderBy(desc(examSubmissions.attemptNumber));

  const attemptsUsed = subs.length;
  const latest = subs[0] ?? null;

  /* -------- if already in-progress, resume -------- */
  if (latest && latest.status === "started") {
    // optional: check if time exceeded → auto-submit empty? we just allow resume
    return {
      success: true,
      submissionId: latest.id,
      attemptNumber: latest.attemptNumber,
    };
  }

  /* -------- if passed already or max attempts done -------- */
  if (latest?.status === "evaluated") {
    // check passed via stored data
    const [sub] = await db
      .select({ passed: examSubmissions.passed })
      .from(examSubmissions)
      .where(eq(examSubmissions.id, latest.id))
      .limit(1);

    if (sub?.passed)
      return { success: false, error: "You have already passed this exam" };
  }

  if (attemptsUsed >= exam.maxAttempts)
    return { success: false, error: "Maximum attempts reached" };

  /* -------- create new attempt -------- */
  const attemptNumber = attemptsUsed + 1;

  const [created] = await db
    .insert(examSubmissions)
    .values({
      examId,
      userId,
      attemptNumber,
      status: "started",
    })
    .returning();

  return {
    success: true,
    submissionId: created.id,
    attemptNumber: created.attemptNumber,
  };
}

/* =========================================================
   GET ATTEMPT (with questions + any saved answers)
========================================================= */

export async function getExamAttempt(submissionId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  const [sub] = await db
    .select({
      id: examSubmissions.id,
      examId: examSubmissions.examId,
      attemptNumber: examSubmissions.attemptNumber,
      status: examSubmissions.status,
      startedAt: examSubmissions.startedAt,

      examTitle: exams.title,
      examDescription: exams.description,
      examType: exams.type,
      duration: exams.duration,
      totalScore: exams.totalScore,
      passingScore: exams.passingScore,
      maxAttempts: exams.maxAttempts,
    })
    .from(examSubmissions)
    .leftJoin(exams, eq(examSubmissions.examId, exams.id))
    .where(
      and(
        eq(examSubmissions.id, submissionId),
        eq(examSubmissions.userId, userId)
      )
    )
    .limit(1);

  if (!sub) return { success: false, error: "Attempt not found" };
  if (sub.status !== "started")
    return { success: false, error: "This attempt is already submitted" };

  const qs = await db
    .select({
      id: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      marks: examQuestions.marks,
      order: examQuestions.order,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, sub.examId))
    .orderBy(asc(examQuestions.order), asc(examQuestions.createdAt));

  const data: ExamAttemptData = {
    examId: sub.examId,
    examTitle: sub.examTitle ?? "Exam",
    examDescription: sub.examDescription ?? null,
    examType: sub.examType ?? "pre",
    duration: sub.duration ?? 0,
    totalScore: sub.totalScore ?? 0,
    passingScore: sub.passingScore ?? 0,
    maxAttempts: sub.maxAttempts ?? 1,

    submissionId: sub.id,
    attemptNumber: sub.attemptNumber,
    startedAt: sub.startedAt,
    status: sub.status,

    questions: qs,
  };

  return { success: true, data };
}

/* =========================================================
   SUBMIT ATTEMPT
   - computes score from answers vs correct options
========================================================= */

export type SubmitAnswer = {
  questionId: string;
  selectedOption: number | null;
};

export async function submitExamAttempt(
  submissionId: string,
  answers: SubmitAnswer[],
  timeTaken: number
) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized" };

  /* -------- verify submission belongs to user & is in-progress -------- */
  const [sub] = await db
    .select()
    .from(examSubmissions)
    .where(
      and(
        eq(examSubmissions.id, submissionId),
        eq(examSubmissions.userId, userId)
      )
    )
    .limit(1);

  if (!sub) return { success: false, error: "Attempt not found" };
  if (sub.status !== "started")
    return { success: false, error: "Attempt already submitted" };

  /* -------- fetch exam + questions -------- */
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, sub.examId))
    .limit(1);

  if (!exam) return { success: false, error: "Exam not found" };

  const qs = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, exam.id));

  const qMap = new Map(qs.map((q) => [q.id, q]));

  /* -------- evaluate -------- */
  let score = 0;
  const answerRows: {
    submissionId: string;
    questionId: string;
    selectedOption: number | null;
    isCorrect: boolean | null;
    marksObtained: number;
  }[] = [];

  for (const q of qs) {
    const ans = answers.find((a) => a.questionId === q.id);
    const selected = ans?.selectedOption ?? null;

    if (selected === null || selected === undefined) {
      // unattempted
      answerRows.push({
        submissionId,
        questionId: q.id,
        selectedOption: null,
        isCorrect: false,
        marksObtained: 0,
      });
      continue;
    }

    const isCorrect = selected === q.correctOption;
    const marksObtained = isCorrect ? q.marks : 0;
    score += marksObtained;

    answerRows.push({
      submissionId,
      questionId: q.id,
      selectedOption: selected,
      isCorrect,
      marksObtained,
    });
  }

  const totalScore = exam.totalScore;
  const percentage =
    totalScore > 0 ? ((score / totalScore) * 100).toFixed(2) : "0.00";
  const passed = score >= exam.passingScore;

  /* -------- delete old answers (safety) then insert -------- */
  await db
    .delete(examSubmissionAnswers)
    .where(eq(examSubmissionAnswers.submissionId, submissionId));

  if (answerRows.length > 0) {
    await db.insert(examSubmissionAnswers).values(answerRows);
  }

  /* -------- update submission -------- */
  await db
    .update(examSubmissions)
    .set({
      status: "evaluated",
      submittedAt: new Date(),
      score,
      totalScore,
      percentage,
      passed,
      timeTaken,
    })
    .where(eq(examSubmissions.id, submissionId));

  return {
    success: true,
    result: { score, totalScore, percentage, passed },
  };
}