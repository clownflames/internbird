import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { savedPosts, posts, users } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const page = parseInt(new URL(request.url).searchParams.get("page") || "1");
    const limit = Math.min(parseInt(new URL(request.url).searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db.select({
        id: posts.id,
        caption: posts.caption,
        media: posts.media,
        mediaType: posts.mediaType,
        location: posts.location,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        savedAt: savedPosts.createdAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
        },
      })
      .from(savedPosts)
      .innerJoin(posts, eq(savedPosts.postId, posts.id))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(savedPosts.userId, session.user.id), eq(posts.isDeleted, false)))
      .orderBy(desc(savedPosts.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(savedPosts).where(eq(savedPosts.userId, session.user.id)),
    ]);

    return successResponse(results, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}