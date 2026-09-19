import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { lors, internships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const [results] = await Promise.all([
      db.select({
        id: lors.id,
        lorNumber: lors.lorNumber,
        position: lors.position,
        internshipName: lors.internshipName,
        startDate: lors.startDate,
        endDate: lors.endDate,
        issueDate: lors.issueDate,
        performance: lors.performance,
        skills: lors.skills,
        achievements: lors.achievements,
        recommenderName: lors.recommenderName,
        recommenderDesignation: lors.recommenderDesignation,
        recommenderEmail: lors.recommenderEmail,
        companyName: lors.companyName,
        verificationCode: lors.verificationCode,
        status: lors.status,
        createdAt: lors.createdAt,
        internship: {
          id: internships.id,
          name: internships.name,
        },
      })
      .from(lors)
      .innerJoin(internships, eq(lors.internshipId, internships.id))
      .where(eq(lors.userId, session.user.id))
      .orderBy(desc(lors.createdAt)),
    ]);

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}