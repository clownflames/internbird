import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { lors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const lor = await db.select().from(lors).where(and(eq(lors.id, id), eq(lors.userId, session.user.id))).limit(1);
    if (!lor[0]) return notFoundResponse("LOR not found");

    return successResponse(lor[0]);
  } catch (error) {
    return handleApiError(error);
  }
}