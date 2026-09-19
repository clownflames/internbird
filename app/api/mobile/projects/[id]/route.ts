import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { projects, projectSubmissions, exams, examSubmissions, internshipRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project[0]) return notFoundResponse("Project not found");

    const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, session.user.id), eq(internshipRegistrations.internshipId, project[0].internshipId))).limit(1);
    if (!reg[0]) return errorResponse("Not registered for this internship", 403);

    // Check if end exam passed
    const endExams = await db.select().from(exams).where(and(eq(exams.internshipId, project[0].internshipId), eq(exams.type, "end"), eq(exams.isPublished, true)));
    let examPassed = false;
    for (const exam of endExams) {
      const submission = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, exam.id), eq(examSubmissions.userId, session.user.id), eq(examSubmissions.passed, true))).limit(1);
      if (submission[0]) { examPassed = true; break; }
    }

    const submission = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.projectId, id), eq(projectSubmissions.userId, session.user.id))).limit(1);

    return successResponse({
      ...project[0],
      isUnlocked: examPassed,
      userSubmission: submission[0] || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}