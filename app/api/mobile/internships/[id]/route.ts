import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internships, internshipRegistrations, learningPages, exams, projects, users } from "@/db/schema";
import { eq, and, desc, asc, count, inArray } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const internship = await db.select().from(internships).where(eq(internships.id, id)).limit(1);
    if (!internship[0]) return notFoundResponse("Internship not found");

    const item = internship[0];

    const [learning, examsList, projectsList] = await Promise.all([
      db.select().from(learningPages).where(and(eq(learningPages.internshipId, id), eq(learningPages.isPublished, true))).orderBy(asc(learningPages.order)),
      db.select().from(exams).where(and(eq(exams.internshipId, id), eq(exams.isPublished, true))).orderBy(asc(exams.createdAt)),
      db.select().from(projects).where(and(eq(projects.internshipId, id), eq(projects.isActive, true), eq(projects.isPublished, true))).orderBy(asc(projects.order)),
    ]);

    let hasRegistered = false;
    let registrationStatus = null;
    let registrationId = null;

    if (userId) {
      const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.internshipId, id))).limit(1);
      if (reg[0]) {
        hasRegistered = true;
        registrationStatus = reg[0].status;
        registrationId = reg[0].id;
      }
    }

    return successResponse({
      ...item,
      price: item.price?.toString() || null,
      discountPrice: item.discountPrice?.toString() || null,
      learningPages: learning,
      exams: examsList,
      projects: projectsList,
      hasRegistered,
      registrationStatus,
      registrationId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}