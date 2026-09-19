import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, postComments, users, commentLikes } from "@/db/schema";
import { eq, and, desc, count, isNull, asc, inArray } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { createCommentSchema } from "@/lib/mobile/validation";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const postId = pathParts[pathParts.length - 3];
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db.select({
        id: postComments.id,
        content: postComments.content,
        likesCount: postComments.likesCount,
        isEdited: postComments.isEdited,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
        },
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(and(eq(postComments.postId, postId), eq(postComments.isDeleted, false), isNull(postComments.parentId)))
      .orderBy(desc(postComments.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(postComments).where(and(eq(postComments.postId, postId), eq(postComments.isDeleted, false), isNull(postComments.parentId))),
    ]);

    let likedComments = new Set();
    if (userId && results.length > 0) {
      const likes = await db.select({ commentId: commentLikes.commentId }).from(commentLikes).where(and(eq(commentLikes.userId, userId), inArray(commentLikes.commentId, results.map(r => r.id))));
      likes.forEach(l => likedComments.add(l.commentId));
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(results.map(async (c) => {
      const replies = await db.select({
        id: postComments.id,
        content: postComments.content,
        likesCount: postComments.likesCount,
        isEdited: postComments.isEdited,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
        },
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(and(eq(postComments.parentId, c.id), eq(postComments.isDeleted, false)))
      .orderBy(asc(postComments.createdAt))
      .limit(3);

      return {
        ...c,
        isLiked: likedComments.has(c.id),
        replies,
      };
    }));

    return successResponse(commentsWithReplies, undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}