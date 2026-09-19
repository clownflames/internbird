import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internships, internshipRegistrations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { registerInternshipSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const internship = await db.select().from(internships).where(eq(internships.id, id)).limit(1);
    if (!internship[0]) return notFoundResponse("Internship not found");

    if (!internship[0].registrationOpen) return errorResponse("Registration closed", 400);

    const existing = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, session.user.id), eq(internshipRegistrations.internshipId, id))).limit(1);
    if (existing[0]) return errorResponse("Already registered", 400);

    const data = await validateBody(registerInternshipSchema)(request);

    const [registration] = await db.insert(internshipRegistrations).values({
      userId: session.user.id,
      internshipId: id,
      ...data,
      status: "pending",
    }).returning();

    return successResponse(registration, "Registration successful");
  } catch (error) {
    return handleApiError(error);
  }
}