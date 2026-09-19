import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, postComments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  handleApiError,
  validateBody,
} from "@/lib/mobile";
import { createCommentSchema } from "@/lib/mobile/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }   // 👈 Promise
) {
  try {
    const { id: postId } = await params;             // 👈 await
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(createCommentSchema)(request);

    // Post exists?
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (!post) return notFoundResponse("Post not found");

    // If replying, parent must exist and belong to same post
    if (data.parentId) {
      const [parent] = await db
        .select()
        .from(postComments)
        .where(eq(postComments.id, data.parentId))
        .limit(1);
      if (!parent) return notFoundResponse("Parent comment not found");
      if (parent.postId !== postId)
        return errorResponse("Invalid parent comment", 400);
    }

    const [comment] = await db
      .insert(postComments)
      .values({
        postId,
        userId: session.user.id,
        content: data.content,
        parentId: data.parentId || null,
      })
      .returning();

    // Increment post commentsCount
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, postId));

    return successResponse(comment, "Comment added");
  } catch (error: any) {
    if (error?.message?.startsWith("VALIDATION_ERROR:")) {
      return errorResponse(
        error.message.replace("VALIDATION_ERROR: ", ""),
        400
      );
    }
    return handleApiError(error);
  }
}