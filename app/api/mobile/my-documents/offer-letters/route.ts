import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { offerLetters, internships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const [results] = await Promise.all([
      db.select({
        id: offerLetters.id,
        offerNumber: offerLetters.offerNumber,
        position: offerLetters.position,
        department: offerLetters.department,
        documentType: offerLetters.documentType,
        startDate: offerLetters.startDate,
        endDate: offerLetters.endDate,
        issueDate: offerLetters.issueDate,
        stipend: offerLetters.stipend,
        stipendCurrency: offerLetters.stipendCurrency,
        status: offerLetters.status,
        createdAt: offerLetters.createdAt,
        internship: {
          id: internships.id,
          name: internships.name,
        },
      })
      .from(offerLetters)
      .innerJoin(internships, eq(offerLetters.internshipId, internships.id))
      .where(eq(offerLetters.userId, session.user.id))
      .orderBy(desc(offerLetters.createdAt)),
    ]);

    return successResponse(results.map(r => ({ ...r, stipend: r.stipend?.toString() || null })));
  } catch (error) {
    return handleApiError(error);
  }
}