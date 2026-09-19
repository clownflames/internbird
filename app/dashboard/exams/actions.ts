"use server";

import { db } from "@/db";
import {
  exams,
  examSubmissions,
  internships,
  internshipRegistrations,
} from "@/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { getSession } from "@/auth";

/* =========================================================
   TYPES
========================================================= */

export type UserExamItem = {
  examId: string;
  examTitle: string;
  examDescription: string | null;
  examType: "pre" | "end";
  duration: number;
  totalScore: number;
  passingScore: number;
  maxAttempts: number;

  internshipId: string;
  internshipName: string | null;

  // submission info (latest attempt)
  submissionId: string | null;
  attemptNumber: number;
  attemptsUsed: number;
  status: "not_started" | "started" | "submitted" | "evaluated";
  score: number | null;
  percentage: string | null;
  passed: boolean | null;
  submittedAt: Date | null;

  canStart: boolean;
  reason?: string;
};

/* =========================================================
   GET MY EXAMS
========================================================= */

export async function getMyExams() {
  const session = await getSession();
  if (!session?.user) return { success: false, error: "Unauthorized", data: [] };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { success: false, error: "Unauthorized", data: [] };

  /* ---------------------------------------------
     1) Find internships user is enrolled in
        (active or completed registrations)
  --------------------------------------------- */
  const enrolledRegs = await db
    .select({
      internshipId: internshipRegistrations.internshipId,
      status: internshipRegistrations.status,
    })
    .from(internshipRegistrations)
    .where(eq(internshipRegistrations.userId, userId));

  const enrolledIds = enrolledRegs
    .filter((r) => r.status === "active" || r.status === "completed")
    .map((r) => r.internshipId);

  if (enrolledIds.length === 0) {
    return { success: true, data: [] as UserExamItem[] };
  }

  /* ---------------------------------------------
     2) Fetch published exams for those internships
  --------------------------------------------- */
  const examRows = await db
    .select({
      examId: exams.id,
      examTitle: exams.title,
      examDescription: exams.description,
      examType: exams.type,
      duration: exams.duration,
      totalScore: exams.totalScore,
      passingScore: exams.passingScore,
      maxAttempts: exams.maxAttempts,
      internshipId: exams.internshipId,
      internshipName: internships.name,
    })
    .from(exams)
    .leftJoin(internships, eq(exams.internshipId, internships.id))
    .where(
      and(
        eq(exams.isPublished, true),
        inArray(exams.internshipId, enrolledIds)
      )
    )
    .orderBy(desc(exams.createdAt));

  if (examRows.length === 0) {
    return { success: true, data: [] as UserExamItem[] };
  }

  /* ---------------------------------------------
     3) Fetch user's submissions for these exams
  --------------------------------------------- */
  const examIds = examRows.map((e) => e.examId);

  const subs = await db
    .select({
      id: examSubmissions.id,
      examId: examSubmissions.examId,
      attemptNumber: examSubmissions.attemptNumber,
      status: examSubmissions.status,
      score: examSubmissions.score,
      totalScore: examSubmissions.totalScore,
      percentage: examSubmissions.percentage,
      passed: examSubmissions.passed,
      submittedAt: examSubmissions.submittedAt,
      startedAt: examSubmissions.startedAt,
    })
    .from(examSubmissions)
    .where(
      and(
        eq(examSubmissions.userId, userId),
        inArray(examSubmissions.examId, examIds)
      )
    )
    .orderBy(desc(examSubmissions.attemptNumber));

  /* ---------------------------------------------
     4) Merge
  --------------------------------------------- */
  const data: UserExamItem[] = examRows.map((exam) => {
    const examSubs = subs.filter((s) => s.examId === exam.examId);
    const attemptsUsed = examSubs.length;
    const latest = examSubs[0] ?? null;

    let status: UserExamItem["status"] = "not_started";
    if (latest) status = latest.status;

    const canStart =
      (status === "not_started" || status === "submitted") &&
      attemptsUsed < exam.maxAttempts &&
      !(latest?.status === "evaluated");

    let reason: string | undefined;
    if (latest?.status === "evaluated" && latest.passed) {
      reason = "You have passed this exam";
    } else if (attemptsUsed >= exam.maxAttempts) {
      reason = "Maximum attempts reached";
    } else if (latest?.status === "started") {
      reason = "You have an in-progress attempt";
    }

    return {
      examId: exam.examId,
      examTitle: exam.examTitle,
      examDescription: exam.examDescription,
      examType: exam.examType,
      duration: exam.duration,
      totalScore: exam.totalScore,
      passingScore: exam.passingScore,
      maxAttempts: exam.maxAttempts,
      internshipId: exam.internshipId,
      internshipName: exam.internshipName,

      submissionId: latest?.id ?? null,
      attemptNumber: latest?.attemptNumber ?? 0,
      attemptsUsed,
      status,
      score: latest?.score ?? null,
      percentage: latest?.percentage ?? null,
      passed: latest?.passed ?? null,
      submittedAt: latest?.submittedAt ?? null,

      canStart,
      reason,
    };
  });

  return { success: true, data };
}