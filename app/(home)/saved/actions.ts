"use server";

import { db } from "@/db";
import {
  savedPosts,
  posts,
  users,
  postLikes,
} from "@/db/schema";
import { getSession } from "@/auth";
import { and, eq, desc, inArray } from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type SavedPostItem = {
  kind: "post";
  id: string;
  caption: string | null;
  media: {
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  mediaType: "image" | "video" | "text" | "mixed";
  visibility: "public" | "connections" | "private";
  location: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEdited: boolean;
  createdAt: string;
  savedAt: string;

  author: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };

  isLikedByMe: boolean;
  isSavedByMe: boolean;
  isFollowingAuthor: boolean;
  isOwnPost: boolean;
};

/* =========================================================
   GET SAVED POSTS
========================================================= */

export async function getSavedPosts(
  limit = 20,
  offset = 0
): Promise<{ items: SavedPostItem[]; hasMore: boolean }> {
  const session = await getSession();
  const currentUserId = session?.user?.id ?? null;

  if (!currentUserId) {
    return { items: [], hasMore: false };
  }

  /* ---------- fetch saved rows + join posts & author ---------- */
  const rows = await db
    .select({
      savedAt: savedPosts.createdAt,

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
    .from(savedPosts)
    .innerJoin(posts, eq(posts.id, savedPosts.postId))
    .innerJoin(users, eq(users.id, posts.userId))
    .where(
      and(
        eq(savedPosts.userId, currentUserId),
        eq(posts.isDeleted, false)
      )
    )
    .orderBy(desc(savedPosts.createdAt))
    .limit(limit + 1) // +1 for hasMore check
    .offset(offset);

  const hasMore = rows.length > limit;
  const trimmed = rows.slice(0, limit);

  /* ---------- liked ids ---------- */
  let likedPostIds: Set<string> = new Set();

  if (trimmed.length > 0) {
    const ids = trimmed.map((p) => p.id);
    const likedRows = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, currentUserId),
          inArray(postLikes.postId, ids)
        )
      );
    likedPostIds = new Set(likedRows.map((r) => r.postId));
  }

  /* ---------- shape ---------- */
  const items: SavedPostItem[] = trimmed.map((p) => ({
    kind: "post",
    id: p.id,
    caption: p.caption,
    media: p.media ?? [],
    mediaType: p.mediaType,
    visibility: p.visibility,
    location: p.location,
    tags: p.tags ?? [],
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    sharesCount: p.sharesCount,
    isEdited: p.isEdited,
    createdAt: p.createdAt.toISOString(),
    savedAt: p.savedAt.toISOString(),

    author: {
      id: p.authorId,
      name: p.authorName,
      image: p.authorImage,
      headline: p.authorHeadline,
    },

    isLikedByMe: likedPostIds.has(p.id),
    isSavedByMe: true, // obviously saved
    isFollowingAuthor: false, // optional — leave as false or fetch
    isOwnPost: currentUserId === p.authorId,
  }));

  return { items, hasMore };
}