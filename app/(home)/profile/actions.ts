"use server";

import { db } from "@/db";
import {
  users,
  posts,
  followers,
  connections,
  certificates,
  internshipRegistrations,
  postLikes,
  savedPosts,
} from "@/db/schema";
import { getSession } from "@/auth";
import {
  and,
  eq,
  or,
  desc,
  sql,
  inArray,
  ne,
} from "drizzle-orm";
import { getPresignedUploadUrl } from "@/lib/r2";

/* =========================================================
   TYPES
========================================================= */

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  coverImage: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  createdAt: string;

  postsCount: number;
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
  internshipsCount: number;
  certificatesCount: number;
};

export type ProfilePost = {
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

export type ProfileRelation =
  | "self"
  | "following"
  | "connected"
  | "pending_sent"
  | "pending_received"
  | "none";

/* =========================================================
   GET PROFILE DATA
========================================================= */

export async function getProfileData(userId?: string) {
  const session = await getSession();
  const currentUserId = session?.user?.id ?? null;
  const targetUserId = userId ?? currentUserId;

  if (!targetUserId) {
    return {
      user: null,
      posts: [] as ProfilePost[],
      relation: "none" as ProfileRelation,
    };
  }

  /* ---------- 1. User row ---------- */
  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      coverImage: users.coverImage,
      headline: users.headline,
      bio: users.bio,
      location: users.location,
      website: users.website,
      phone: users.phone,
      createdAt: users.createdAt,
      followersCount: users.followersCount,
      followingCount: users.followingCount,
      connectionsCount: users.connectionsCount,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!userRow) {
    return {
      user: null,
      posts: [] as ProfilePost[],
      relation: "none" as ProfileRelation,
    };
  }

  /* ---------- 2. Counts (posts, internships, certs) ---------- */
  const [[postsRow], [internshipRow], [certRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.userId, targetUserId), eq(posts.isDeleted, false))),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(internshipRegistrations)
      .where(
        and(
          eq(internshipRegistrations.userId, targetUserId),
          inArray(internshipRegistrations.status, ["active", "completed"])
        )
      ),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, targetUserId),
          eq(certificates.status, "issued")
        )
      ),
  ]);

  const user: ProfileUser = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    image: userRow.image,
    coverImage: userRow.coverImage,
    headline: userRow.headline,
    bio: userRow.bio,
    location: userRow.location,
    website: userRow.website,
    phone: userRow.phone,
    createdAt: userRow.createdAt.toISOString(),
    postsCount: postsRow?.count ?? 0,
    followersCount: userRow.followersCount,
    followingCount: userRow.followingCount,
    connectionsCount: userRow.connectionsCount,
    internshipsCount: internshipRow?.count ?? 0,
    certificatesCount: certRow?.count ?? 0,
  };

  /* ---------- 3. Relation ---------- */
  let relation: ProfileRelation = "none";

  if (!currentUserId) {
    relation = "none";
  } else if (currentUserId === targetUserId) {
    relation = "self";
  } else {
    const [followRow] = await db
      .select({ id: followers.id })
      .from(followers)
      .where(
        and(
          eq(followers.followerId, currentUserId),
          eq(followers.followingId, targetUserId)
        )
      )
      .limit(1);

    const [connRow] = await db
      .select({
        id: connections.id,
        requesterId: connections.requesterId,
        status: connections.status,
      })
      .from(connections)
      .where(
        and(
          or(
            and(
              eq(connections.requesterId, currentUserId),
              eq(connections.addresseeId, targetUserId)
            ),
            and(
              eq(connections.requesterId, targetUserId),
              eq(connections.addresseeId, currentUserId)
            )
          ),
          ne(connections.status, "rejected")
        )
      )
      .limit(1);

    if (connRow?.status === "accepted") {
      relation = "connected";
    } else if (connRow?.status === "pending") {
      relation =
        connRow.requesterId === currentUserId
          ? "pending_sent"
          : "pending_received";
    } else if (followRow) {
      relation = "following";
    } else {
      relation = "none";
    }
  }

  /* ---------- 4. Posts ---------- */
  const postRows = await db
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
    .where(and(eq(posts.userId, targetUserId), eq(posts.isDeleted, false)))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  /* ---------- 5. Liked/Saved IDs ---------- */
  let likedPostIds: Set<string> = new Set();
  let savedPostIds: Set<string> = new Set();

  if (currentUserId && postRows.length > 0) {
    const ids = postRows.map((p) => p.id);
    const [likedRows, savedRows] = await Promise.all([
      db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(
          and(
            eq(postLikes.userId, currentUserId),
            inArray(postLikes.postId, ids)
          )
        ),
      db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, currentUserId),
            inArray(savedPosts.postId, ids)
          )
        ),
    ]);
    likedPostIds = new Set(likedRows.map((r) => r.postId));
    savedPostIds = new Set(savedRows.map((r) => r.postId));
  }

  const profilePosts: ProfilePost[] = postRows.map((p) => ({
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

    author: {
      id: p.authorId,
      name: p.authorName,
      image: p.authorImage,
      headline: p.authorHeadline,
    },

    isLikedByMe: likedPostIds.has(p.id),
    isSavedByMe: savedPostIds.has(p.id),
    isFollowingAuthor: relation === "following",
    isOwnPost: currentUserId === p.authorId,
  }));

  return { user, posts: profilePosts, relation };
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

export type UpdateProfileInput = {
  name?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
};

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await db
      .update(users)
      .set({
        name: input.name?.trim() || undefined,
        headline: input.headline?.trim() || null,
        bio: input.bio?.trim() || null,
        location: input.location?.trim() || null,
        website: input.website?.trim() || null,
        phone: input.phone?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (err) {
    console.error("updateProfile", err);
    return { success: false, error: "Failed to update profile" };
  }
}

/* =========================================================
   UPDATE PROFILE IMAGE (avatar or cover)
========================================================= */

export async function updateProfileImage(
  kind: "avatar" | "cover",
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { success: false, error: "Not authenticated" };
  if (!imageUrl) return { success: false, error: "Invalid image URL" };

  try {
    if (kind === "avatar") {
      await db
        .update(users)
        .set({ image: imageUrl, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } else {
      await db
        .update(users)
        .set({ coverImage: imageUrl, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return { success: true };
  } catch (err) {
    console.error("updateProfileImage", err);
    return { success: false, error: "Failed to update image" };
  }
}

/* =========================================================
   GET UPLOAD URL (presigned)
========================================================= */

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  folder: "posts" | "avatars" | "covers" = "posts"
): Promise<{
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: string;
}> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { success: false, error: "Not authenticated" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(contentType))
    return { success: false, error: "Invalid image type" };

  try {
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `${folder}/${userId}/${timestamp}-${random}.${ext}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(
      key,
      contentType
    );

    return { success: true, uploadUrl, publicUrl, key };
  } catch (err) {
    console.error("getUploadUrl error", err);
    return { success: false, error: "Failed to generate upload URL" };
  }
}