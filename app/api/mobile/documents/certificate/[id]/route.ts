import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const cert = await db.select().from(certificates).where(and(eq(certificates.id, id), eq(certificates.userId, session.user.id))).limit(1);
    if (!cert[0]) return notFoundResponse("Certificate not found");

    return successResponse({ ...cert[0], score: cert[0].score?.toString() || null });
  } catch (error) {
    return handleApiError(error);
  }
}