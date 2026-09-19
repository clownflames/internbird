import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { examSubmissions, projectSubmissions, exams, projects, internshipRegistrations } from "@/db/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const userId = session.user.id;

    // Get upcoming exam attempts
    const registrations = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.status, "active")));
    const internshipIds = registrations.map(r => r.internshipId);

    let upcomingExams: any[] = [];
    let upcomingProjects: any[] = [];

    if (internshipIds.length > 0) {
      const upcomingExamsRaw = await db.select({
        id: exams.id,
        title: exams.title,
        type: exams.type,
        duration: exams.duration,
        maxAttempts: exams.maxAttempts,
        internshipId: exams.internshipId,
      }).from(exams).where(and(inArray(exams.internshipId, internshipIds), eq(exams.isPublished, true)));

      for (const exam of upcomingExamsRaw) {
        const attempt = await db.select().from(examSubmissions).where(and(eq(examSubmissions.examId, exam.id), eq(examSubmissions.userId, userId))).orderBy(desc(examSubmissions.attemptNumber)).limit(1);
        const nextAttempt = (attempt[0]?.attemptNumber || 0) + 1;
        if (nextAttempt <= exam.maxAttempts) {
          upcomingExams.push({ ...exam, nextAttempt });
        }
      }

      const upcomingProjectsRaw = await db.select().from(projects).where(and(inArray(projects.internshipId, internshipIds), eq(projects.isActive, true), eq(projects.isPublished, true)));
      for (const project of upcomingProjectsRaw) {
        const submission = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.projectId, project.id), eq(projectSubmissions.userId, userId))).limit(1);
        if (!submission[0] || submission[0].status === "rejected") {
          upcomingProjects.push(project);
        }
      }
    }

    return successResponse({ upcomingExams, upcomingProjects });
  } catch (error) {
    return handleApiError(error);
  }
}