import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { internshipRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const registrationId = pathParts[pathParts.length - 3];

    const reg = await db.select().from(internshipRegistrations).where(and(eq(internshipRegistrations.id, registrationId), eq(internshipRegistrations.userId, session.user.id))).limit(1);
    if (!reg[0]) return notFoundResponse("Registration not found");
    if (reg[0].status === "completed") return errorResponse("Already completed", 400);
    if (reg[0].status === "cancelled") return errorResponse("Already cancelled", 400);

    await db.update(internshipRegistrations).set({ status: "cancelled" }).where(eq(internshipRegistrations.id, registrationId));

    return successResponse({ cancelled: true });
  } catch (error) {
    return handleApiError(error);
  }
}