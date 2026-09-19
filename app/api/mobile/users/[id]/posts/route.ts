import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const userId = pathParts[pathParts.length - 3];
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser[0]) return notFoundResponse("User not found");

    const visibility = userId === session.user.id ? "all" : "public";
    const conditions = [eq(posts.userId, userId), eq(posts.isDeleted, false)];
    if (visibility === "public") conditions.push(eq(posts.visibility, "public"));

    const [results, totalResult] = await Promise.all([
      db.select().from(posts).where(and(...conditions)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(posts).where(and(...conditions)),
    ]);

    return successResponse(results, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}