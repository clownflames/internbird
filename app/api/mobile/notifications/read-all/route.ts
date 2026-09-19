import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));

    return successResponse({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}