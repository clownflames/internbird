import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const settings = await db.select().from(notifications).where(eq(notifications.userId, session.user.id)).limit(1);
    // Return default settings if not set
    return successResponse({
      postLike: true,
      postComment: true,
      commentReply: true,
      commentLike: true,
      follow: true,
      connectionRequest: true,
      connectionAccepted: true,
      internshipRegistered: true,
      examPublished: true,
      certificateIssued: true,
      offerLetterIssued: true,
      mention: true,
      system: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}