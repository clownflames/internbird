import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { offerLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const offer = await db.select().from(offerLetters).where(and(eq(offerLetters.id, id), eq(offerLetters.userId, session.user.id))).limit(1);
    if (!offer[0]) return notFoundResponse("Offer letter not found");

    return successResponse({ ...offer[0], stipend: offer[0].stipend?.toString() || null });
  } catch (error) {
    return handleApiError(error);
  }
}