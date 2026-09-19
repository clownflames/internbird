import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { postComments, commentLikes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const commentId = pathParts[pathParts.length - 3];
    const action = pathParts[pathParts.length - 2];

    const comment = await db.select().from(postComments).where(eq(postComments.id, commentId)).limit(1);
    if (!comment[0]) return notFoundResponse("Comment not found");

    if (action === "like") {
      const existing = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.user.id))).limit(1);
      if (existing[0]) return errorResponse("Already liked", 400);

      await db.insert(commentLikes).values({ commentId, userId: session.user.id });
      await db.update(postComments).set({ likesCount: sql`${postComments.likesCount} + 1` }).where(eq(postComments.id, commentId));
      return successResponse({ liked: true });
    } else if (action === "unlike") {
      const existing = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.user.id))).limit(1);
      if (!existing[0]) return errorResponse("Not liked", 400);

      await db.delete(commentLikes).where(eq(commentLikes.id, existing[0].id));
      await db.update(postComments).set({ likesCount: sql`${postComments.likesCount} - 1` }).where(eq(postComments.id, commentId));
      return successResponse({ liked: false });
    }

    return errorResponse("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}