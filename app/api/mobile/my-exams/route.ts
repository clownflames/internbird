import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { exams, examSubmissions, internshipRegistrations } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db.select({
        id: examSubmissions.id,
        examId: examSubmissions.examId,
        attemptNumber: examSubmissions.attemptNumber,
        status: examSubmissions.status,
        score: examSubmissions.score,
        totalScore: examSubmissions.totalScore,
        percentage: examSubmissions.percentage,
        passed: examSubmissions.passed,
        submittedAt: examSubmissions.submittedAt,
        exam: {
          id: exams.id,
          title: exams.title,
          type: exams.type,
          internshipId: exams.internshipId,
        },
      })
      .from(examSubmissions)
      .innerJoin(exams, eq(examSubmissions.examId, exams.id))
      .where(eq(examSubmissions.userId, session.user.id))
      .orderBy(desc(examSubmissions.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(examSubmissions).where(eq(examSubmissions.userId, session.user.id)),
    ]);

    return successResponse(results, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}