import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  posts,
  users,
  postLikes,
  savedPosts,
  followers,
  connections,
} from "@/db/schema";
import { eq, and, desc, count, inArray, or } from "drizzle-orm";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20"),
      50
    );
    const offset = (page - 1) * limit;
    const type = url.searchParams.get("type") || "feed";

    const whereConditions = [eq(posts.isDeleted, false)];

    if (type === "feed") {
      const followingSub = db
        .select({ followingId: followers.followingId })
        .from(followers)
        .where(
          and(
            eq(followers.followerId, session.user.id),
            eq(followers.status, "active")
          )
        );

      const connSub1 = db
        .select({ addresseeId: connections.addresseeId })
        .from(connections)
        .where(
          and(
            eq(connections.requesterId, session.user.id),
            eq(connections.status, "accepted")
          )
        );

      const connSub2 = db
        .select({ requesterId: connections.requesterId })
        .from(connections)
        .where(
          and(
            eq(connections.addresseeId, session.user.id),
            eq(connections.status, "accepted")
          )
        );

      const feedCondition = or(
        eq(posts.visibility, "public"),
        and(
          eq(posts.visibility, "connections"),
          or(
            inArray(posts.userId, followingSub),
            inArray(posts.userId, connSub1),
            inArray(posts.userId, connSub2)
          )
        ),
        eq(posts.userId, session.user.id)
      );
      if (feedCondition) whereConditions.push(feedCondition);
    } else if (type === "explore") {
      whereConditions.push(eq(posts.visibility, "public"));
    } else if (type === "my") {
      whereConditions.push(eq(posts.userId, session.user.id));
    }

    const [results, totalResult] = await Promise.all([
      db
        .select({
          id: posts.id,
          caption: posts.caption,
          media: posts.media,
          mediaType: posts.mediaType,
          visibility: posts.visibility,
          location: posts.location,
          tags: posts.tags,
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount,
          sharesCount: posts.sharesCount,
          isEdited: posts.isEdited,
          createdAt: posts.createdAt,
          user: {
            id: users.id,
            name: users.name,
            image: users.image,
            headline: users.headline,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(posts)
        .where(and(...whereConditions)),
    ]);

    const postIds = results.map((p) => p.id);
    const likedPosts = new Set<string>();
    const savedPostsSet = new Set<string>();

    if (postIds.length > 0) {
      const likes = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(
          and(
            eq(postLikes.userId, session.user.id),
            inArray(postLikes.postId, postIds)
          )
        );
      likes.forEach((l) => likedPosts.add(l.postId));

      const saves = await db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, session.user.id),
            inArray(savedPosts.postId, postIds)
          )
        );
      saves.forEach((s) => savedPostsSet.add(s.postId));
    }

    const items = results.map((p) => ({
      ...p,
      isLiked: likedPosts.has(p.id),
      isSaved: savedPostsSet.has(p.id),
    }));

    const total = totalResult[0]?.count || 0;

    return successResponse(items, undefined, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}