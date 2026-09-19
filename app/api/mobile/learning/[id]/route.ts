import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { learningPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    // Learning pages can be viewed without auth if published

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const page = await db.select().from(learningPages).where(eq(learningPages.id, id)).limit(1);
    if (!page[0]) return notFoundResponse("Learning page not found");

    return successResponse(page[0]);
  } catch (error) {
    return handleApiError(error);
  }
}