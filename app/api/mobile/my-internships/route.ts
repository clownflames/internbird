import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internshipRegistrations, internships } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const conditions = [eq(internshipRegistrations.userId, session.user.id)];
    if (status) conditions.push(eq(internshipRegistrations.status, status as any));

    const [results, totalResult] = await Promise.all([
      db.select({
        id: internshipRegistrations.id,
        status: internshipRegistrations.status,
        registeredAt: internshipRegistrations.registeredAt,
        completedAt: internshipRegistrations.completedAt,
        internship: {
          id: internships.id,
          name: internships.name,
          image: internships.image,
          mode: internships.mode,
          duration: internships.duration,
          location: internships.location,
          pricing: internships.pricing,
        },
      })
      .from(internshipRegistrations)
      .innerJoin(internships, eq(internshipRegistrations.internshipId, internships.id))
      .where(and(...conditions))
      .orderBy(desc(internshipRegistrations.registeredAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(internshipRegistrations).where(and(...conditions)),
    ]);

    return successResponse(results, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}