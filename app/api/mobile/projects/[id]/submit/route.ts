import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { projects, projectSubmissions, exams, examSubmissions, internshipRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { projectSubmitSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(projectSubmitSchema)(request);

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const projectId = pathParts[pathParts.length - 2];

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
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
    if (!examPassed) return errorResponse("End exam not passed yet", 403);

    const existing = await db.select().from(projectSubmissions).where(and(eq(projectSubmissions.projectId, projectId), eq(projectSubmissions.userId, session.user.id))).limit(1);
    if (existing[0] && existing[0].status !== "rejected") return errorResponse("Already submitted", 400);

    const [submission] = await db.insert(projectSubmissions).values({
      projectId,
      userId: session.user.id,
      registrationId: reg[0].id,
      status: "submitted",
      submissionUrl: data.submissionUrl || null,
      githubUrl: data.githubUrl || null,
      liveUrl: data.liveUrl || null,
      submissionFiles: data.submissionFiles || [],
      submissionNotes: data.submissionNotes || null,
      submittedAt: new Date(),
    }).returning();

    return successResponse(submission, "Project submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}