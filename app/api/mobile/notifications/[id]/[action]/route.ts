import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const notificationId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    const notification = await db.select().from(notifications).where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id))).limit(1);
    if (!notification[0]) return notFoundResponse("Notification not found");

    if (action === "read") {
      await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, notificationId));
      return successResponse({ read: true });
    } else if (action === "delete") {
      await db.delete(notifications).where(eq(notifications.id, notificationId));
      return successResponse({ deleted: true });
    }

    return errorResponse("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}