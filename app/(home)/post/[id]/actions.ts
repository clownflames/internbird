"use server";

import { db } from "@/db";
import {
  posts,
  users,
  postLikes,
  savedPosts,
  followers,
} from "@/db/schema";
import { auth } from "@/auth";
import { and, eq, desc } from "drizzle-orm";
import type { FeedPost } from "@/app/(home)/actions";

/* =========================================================
   GET SINGLE POST
========================================================= */

export async function getPostById(
  postId: string
): Promise<FeedPost | null> {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const [row] = await db
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
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorHeadline: users.headline,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(and(eq(posts.id, postId), eq(posts.isDeleted, false)))
    .limit(1);

  if (!row) return null;

  // check liked / saved
  let isLikedByMe = false;
  let isSavedByMe = false;

  if (currentUserId) {
    const [liked] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, currentUserId)
        )
      )
      .limit(1);

    const [saved] = await db
      .select()
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.postId, postId),
          eq(savedPosts.userId, currentUserId)
        )
      )
      .limit(1);

    isLikedByMe = !!liked;
    isSavedByMe = !!saved;
  }

  // check following author
  let isFollowingAuthor = false;
  if (currentUserId && currentUserId !== row.authorId) {
    const [f] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, currentUserId),
          eq(followers.followingId, row.authorId)
        )
      )
      .limit(1);
    isFollowingAuthor = !!f;
  }

  const post: FeedPost = {
    kind: "post",
    id: row.id,
    caption: row.caption,
    media: row.media ?? [],
    mediaType: row.mediaType,
    // visibility: row.visibility,
    // visibility:row.visibility,
    location: row.location,
    tags: row.tags ?? [],
    likesCount: row.likesCount,
    commentsCount: row.commentsCount,
    sharesCount: row.sharesCount,
    isEdited: row.isEdited,
    createdAt: row.createdAt.toISOString(),

    author: {
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      headline: row.authorHeadline,
    },

    isLikedByMe,
    isSavedByMe,
    isFollowingAuthor,
    isOwnPost: currentUserId === row.authorId,
  };

  return post;
}