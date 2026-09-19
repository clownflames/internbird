import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { certificates, internships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const [results] = await Promise.all([
      db.select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        title: certificates.title,
        internshipName: certificates.internshipName,
        position: certificates.position,
        documentType: certificates.documentType,
        startDate: certificates.startDate,
        endDate: certificates.endDate,
        issueDate: certificates.issueDate,
        skills: certificates.skills,
        grade: certificates.grade,
        score: certificates.score,
        verificationCode: certificates.verificationCode,
        status: certificates.status,
        createdAt: certificates.createdAt,
        internship: {
          id: internships.id,
          name: internships.name,
        },
      })
      .from(certificates)
      .innerJoin(internships, eq(certificates.internshipId, internships.id))
      .where(eq(certificates.userId, session.user.id))
      .orderBy(desc(certificates.createdAt)),
    ]);

    return successResponse(results.map(r => ({ ...r, score: r.score?.toString() || null })));
  } catch (error) {
    return handleApiError(error);
  }
}