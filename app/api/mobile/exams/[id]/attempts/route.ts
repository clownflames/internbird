import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { exams, examSubmissions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const examId = pathParts[pathParts.length - 3];

    const attempts = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, examId), eq(examSubmissions.userId, session.user.id))).orderBy(desc(examSubmissions.attemptNumber));

    const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    const maxAttempts = exam[0]?.maxAttempts || 1;
    const usedAttempts = attempts.length;
    const remainingAttempts = Math.max(0, maxAttempts - usedAttempts);

    return successResponse({ attempts, remainingAttempts, maxAttempts });
  } catch (error) {
    return handleApiError(error);
  }
}