import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, postComments, commentLikes, savedPosts } from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const postId = pathParts[pathParts.length - 3];
    const action = pathParts[pathParts.length - 2];

    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post[0]) return notFoundResponse("Post not found");

    if (action === "save") {
      const existing = await db.select().from(savedPosts).where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, session.user.id))).limit(1);
      if (existing[0]) return errorResponse("Already saved", 400);

      await db.insert(savedPosts).values({ postId, userId: session.user.id });
      return successResponse({ saved: true });
    } else if (action === "unsave") {
      const existing = await db.select().from(savedPosts).where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, session.user.id))).limit(1);
      if (!existing[0]) return errorResponse("Not saved", 400);

      await db.delete(savedPosts).where(eq(savedPosts.id, existing[0].id));
      return successResponse({ saved: false });
    } else if (action === "share") {
      await db.update(posts).set({ sharesCount: sql`${posts.sharesCount} + 1` }).where(eq(posts.id, postId));
      return successResponse({ shared: true });
    } else if (action === "delete") {
      if (post[0].userId !== session.user.id) return errorResponse("Not authorized", 403);
      await db.update(posts).set({ isDeleted: true }).where(eq(posts.id, postId));
      return successResponse({ deleted: true });
    }

    return errorResponse("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}