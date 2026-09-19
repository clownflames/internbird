import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { postComments, users, commentLikes } from "@/db/schema";
import { eq, and, isNull, desc, asc, count, inArray } from "drizzle-orm";
import {
  successResponse,
  handleApiError,
} from "@/lib/mobile";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
){
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
     const { id: postId } = await params; 

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Top-level comments only (parentId is null)
    const [results, totalResult] = await Promise.all([
      db
        .select({
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
        .where(
          and(
            eq(postComments.postId, postId),
            eq(postComments.isDeleted, false),
            isNull(postComments.parentId)
          )
        )
        .orderBy(desc(postComments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(postComments)
        .where(
          and(
            eq(postComments.postId, postId),
            eq(postComments.isDeleted, false),
            isNull(postComments.parentId)
          )
        ),
    ]);

    // Fetch liked-set for viewer
    let likedSet = new Set<string>();
    if (userId && results.length > 0) {
      const likes = await db
        .select({ commentId: commentLikes.commentId })
        .from(commentLikes)
        .where(
          and(
            eq(commentLikes.userId, userId),
            inArray(
              commentLikes.commentId,
              results.map((r) => r.id)
            )
          )
        );
      likes.forEach((l) => likedSet.add(l.commentId));
    }

    // Attach up to 3 replies to each comment
    const commentsWithReplies = await Promise.all(
      results.map(async (c) => {
        const replies = await db
          .select({
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
          .where(
            and(
              eq(postComments.parentId, c.id),
              eq(postComments.isDeleted, false)
            )
          )
          .orderBy(asc(postComments.createdAt))
          .limit(3);

        return {
          ...c,
          isLiked: likedSet.has(c.id),
          replies: replies.map((r) => ({
            ...r,
            isLiked: likedSet.has(r.id),
          })),
        };
      })
    );

    return successResponse(commentsWithReplies, undefined, {
      page,
      limit,
      total: totalResult[0]?.count || 0,
      totalPages: Math.ceil((totalResult[0]?.count || 0) / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}