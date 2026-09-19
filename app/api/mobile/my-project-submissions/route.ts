import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { projectSubmissions, projects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const [results] = await Promise.all([
      db.select({
        id: projectSubmissions.id,
        projectId: projectSubmissions.projectId,
        status: projectSubmissions.status,
        submissionUrl: projectSubmissions.submissionUrl,
        githubUrl: projectSubmissions.githubUrl,
        liveUrl: projectSubmissions.liveUrl,
        submissionFiles: projectSubmissions.submissionFiles,
        submissionNotes: projectSubmissions.submissionNotes,
        score: projectSubmissions.score,
        feedback: projectSubmissions.feedback,
        submittedAt: projectSubmissions.submittedAt,
        reviewedAt: projectSubmissions.reviewedAt,
        project: {
          id: projects.id,
          title: projects.title,
          internshipId: projects.internshipId,
        },
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(eq(projectSubmissions.userId, session.user.id))
      .orderBy(desc(projectSubmissions.createdAt)),
    ]);

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}