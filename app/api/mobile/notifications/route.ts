import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const unreadOnly = url.searchParams.get("unread") === "true";

    const conditions = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const [results, totalResult, unreadCount] = await Promise.all([
      db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(notifications).where(and(...conditions)),
      db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))),
    ]);

    return successResponse(results, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit), unreadCount: unreadCount[0]?.count || 0 });
  } catch (error) {
    return handleApiError(error);
  }
}