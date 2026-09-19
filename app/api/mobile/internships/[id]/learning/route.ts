import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { learningPages, internshipRegistrations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const internshipId = pathParts[pathParts.length - 2];

    const pages = await db.select().from(learningPages).where(and(eq(learningPages.internshipId, internshipId), eq(learningPages.isPublished, true))).orderBy(asc(learningPages.order));

    let completedPages = new Set();
    if (userId) {
      const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.internshipId, internshipId))).limit(1);
      if (reg[0]) {
        // In a real app, you'd have a learning_progress table
        // For now, we'll return empty set
      }
    }

    return successResponse(pages.map(p => ({
      ...p,
      isCompleted: completedPages.has(p.id),
    })));
  } catch (error) {
    return handleApiError(error);
  }
}