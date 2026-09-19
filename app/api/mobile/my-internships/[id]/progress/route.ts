import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internshipRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const registrationId = pathParts[pathParts.length - 2];

    const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.id, registrationId), eq(internshipRegistrations.userId, session.user.id))).limit(1);
    if (!reg[0]) return notFoundResponse("Registration not found");

    // Calculate progress: learning pages, exams, projects
    return successResponse({
      registration: reg[0],
      progress: {
        learning: { completed: 0, total: 0, percentage: 0 },
        exams: { passed: 0, total: 0, percentage: 0 },
        projects: { submitted: 0, total: 0, percentage: 0 },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}