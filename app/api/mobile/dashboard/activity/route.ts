import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { examSubmissions, projectSubmissions, examQuestions, examSubmissionAnswers } from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const userId = session.user.id;
    const limit = parseInt(new URL(request.url).searchParams.get("limit") || "10");

    const recentExams = await db.select({
      id: examSubmissions.id,
      examId: examSubmissions.examId,
      score: examSubmissions.score,
      totalScore: examSubmissions.totalScore,
      percentage: examSubmissions.percentage,
      passed: examSubmissions.passed,
      submittedAt: examSubmissions.submittedAt,
    }).from(examSubmissions).where(eq(examSubmissions.userId, userId)).orderBy(desc(examSubmissions.createdAt)).limit(limit);

    const recentProjects = await db.select({
      id: projectSubmissions.id,
      projectId: projectSubmissions.projectId,
      status: projectSubmissions.status,
      score: projectSubmissions.score,
      submittedAt: projectSubmissions.submittedAt,
    }).from(projectSubmissions).where(eq(projectSubmissions.userId, userId)).orderBy(desc(projectSubmissions.createdAt)).limit(limit);

    return successResponse({ recentExams, recentProjects });
  } catch (error) {
    return handleApiError(error);
  }
}