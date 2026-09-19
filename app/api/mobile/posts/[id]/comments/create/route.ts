import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, postComments, commentLikes } from "@/db/schema";
import { eq, and, isNull, asc, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { createCommentSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(createCommentSchema)(request);

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const postId = pathParts[pathParts.length - 3];

    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post[0]) return notFoundResponse("Post not found");

    if (data.parentId) {
      const parent = await db.select().from(postComments).where(eq(postComments.id, data.parentId)).limit(1);
      if (!parent[0]) return notFoundResponse("Parent comment not found");
      if (parent[0].postId !== postId) return errorResponse("Invalid parent comment", 400);
    }

    const [comment] = await db.insert(postComments).values({
      postId,
      userId: session.user.id,
      content: data.content,
      parentId: data.parentId || null,
    }).returning();

    await db.update(posts).set({ commentsCount: sql`${posts.commentsCount} + 1` }).where(eq(posts.id, postId));

    return successResponse(comment, "Comment added");
  } catch (error) {
    return handleApiError(error);
  }
}