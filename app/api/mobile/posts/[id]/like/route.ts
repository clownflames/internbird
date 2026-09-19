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
      
      const { id: postId } = await params;   // 👈
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) return unauthorizedResponse();

    // Post exists?
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (!post) return notFoundResponse("Post not found");

    // Already liked?
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(
        and(eq(postLikes.postId, postId), eq(postLikes.userId, session.user.id))
      )
      .limit(1);
    if (existing) return errorResponse("Already liked", 400);

    // Insert like
    await db.insert(postLikes).values({
      postId,
      userId: session.user.id,
    });

    // Increment count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));

    return successResponse({ liked: true });
  } catch (error) {
    return handleApiError(error);
  }
}