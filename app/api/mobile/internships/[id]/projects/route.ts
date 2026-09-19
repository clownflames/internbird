import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { projects, exams, examSubmissions, internshipRegistrations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const internshipId = pathParts[pathParts.length - 2];

    const projectsList = await db.select().from(projects).where(and(eq(projects.internshipId, internshipId), eq(projects.isActive, true), eq(projects.isPublished, true))).orderBy(asc(projects.order));

    let userExamPassed = false;
    if (userId) {
      const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.internshipId, internshipId))).limit(1);
      if (reg[0]) {
        const endExams = await db.select().from(exams).where(and(eq(exams.internshipId, internshipId), eq(exams.type, "end"), eq(exams.isPublished, true)));
        for (const exam of endExams) {
          const submission = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, exam.id), eq(examSubmissions.userId, userId), eq(examSubmissions.passed, true))).limit(1);
          if (submission[0]) {
            userExamPassed = true;
            break;
          }
        }
      }
    }

    return successResponse(projectsList.map(p => ({ ...p, isUnlocked: userExamPassed })));
  } catch (error) {
    return handleApiError(error);
  }
}