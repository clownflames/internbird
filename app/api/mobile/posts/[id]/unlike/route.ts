import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, postLikes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  handleApiError,
} from "@/lib/mobile";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const {id: postId} =  await params;

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (!post) return notFoundResponse("Post not found");

    const [existing] = await db
      .select()
      .from(postLikes)
      .where(
        and(eq(postLikes.postId, postId), eq(postLikes.userId, session.user.id))
      )
      .limit(1);
    if (!existing) return errorResponse("Not liked", 400);

    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
    await db
      .update(posts)
      .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
      .where(eq(posts.id, postId));

    return successResponse({ liked: false });
  } catch (error) {
    return handleApiError(error);
  }
}