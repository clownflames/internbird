import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { exams, internshipRegistrations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const internshipId = pathParts[pathParts.length - 2];

    const examsList = await db.select().from(exams).where(and(eq(exams.internshipId, internshipId), eq(exams.isPublished, true))).orderBy(asc(exams.createdAt));

    return successResponse(examsList);
  } catch (error) {
    return handleApiError(error);
  }
}