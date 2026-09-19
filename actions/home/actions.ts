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
  postComments,
  savedPosts,
  internships,
} from "@/db/schema";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
  and,
  or,
  eq,
  desc,
  sql,
  notInArray,
  inArray,
} from "drizzle-orm";
import { generateFileKey, getPresignedUploadUrl } from "@/lib/r2";

/* =========================================================
   TYPES
========================================================= */

export type SuggestedUser = {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  followersCount: number;
};

export type TrendingTopic = {
  tag: string;
  count: number;
};

export type UpcomingItem = {
  id: string;
  title: string;
  type: "exam" | "event";
  date: string;
};

export type SidebarUserStats = {
  internships: number;
  certificates: number;
  followers: number;
  following: number;
  connections: number;
  name: string;
  email: string;
  image: string | null;
  headline: string | null;
};

export type FeedPost = {
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

export type FeedInternship = {
  kind: "internship";
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  skills: string[];
  qualifications: string[];
  duration: string | null;
  mode: "remote" | "onsite" | "hybrid";
  location: string | null;
  registrationOpen: boolean;
  createdAt: string;

  // pricing
  pricing: "free" | "paid";
  price: string | null;
  discountPrice: string | null;
  currency: string | null;          // 👈 null allow karo
  paymentType: "one_time" | "monthly" | null;  // 👈 null allow karo
  pricingNote: string | null;
};

export type FeedItem = FeedPost | FeedInternship;

export type CurrentUserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  coverImage: string | null;
  headline: string | null;
  postsCount: number;
  connectionsCount: number;
  internshipsCount: number;
  followersCount: number;
};

export type SidebarBadges = {
  network: number;
  notifications: number;
};

export type CreatePostInput = {
  caption: string;
  media: {
    type: "image";
    url: string;
    width?: number;
    height?: number;
  }[];
  mediaType: "text" | "image";
  visibility: "public" | "connections" | "private";
  location?: string;
  tags?: string[];
};

export type UpdatePostInput = {
  caption: string;
  location?: string;
  tags?: string[];
  visibility: "public" | "connections" | "private";
};

export type PostComment = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };
  replies?: PostComment[];
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session?.user?.id ?? null;
  } catch (err) {
    console.error("getCurrentUserId error:", err);
    return null;
  }
}

/* =========================================================
   HOME FEED
========================================================= */

export async function getHomeFeed(limit = 20): Promise<FeedItem[]> {
  const currentUserId = await getCurrentUserId();

  /* ---------- 1. Users I follow ---------- */
  let followingIds: string[] = [];

  if (currentUserId) {
    const rows = await db
      .select({ id: followers.followingId })
      .from(followers)
      .where(eq(followers.followerId, currentUserId));

    followingIds = rows.map((r) => r.id);
  }

  /* ---------- 2. Fetch posts ---------- */
  const postAuthorIds = currentUserId
    ? [currentUserId, ...followingIds]
    : [];

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
    .where(
      and(
        eq(posts.isDeleted, false),
        or(
          eq(posts.visibility, "public"),
          currentUserId ? inArray(posts.userId, postAuthorIds) : sql`false`
        )
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  /* ---------- 3. Liked & Saved IDs ---------- */
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

  /* ---------- 4. Fetch internships (WITH pricing) ---------- */
  const internshipRows = await db
    .select({
      id: internships.id,
      name: internships.name,
      description: internships.description,
      image: internships.image,
      skills: internships.skills,
      qualifications: internships.qualifications,
      duration: internships.duration,
      mode: internships.mode,
      location: internships.location,
      registrationOpen: internships.registrationOpen,
      createdAt: internships.createdAt,

      // pricing
      pricing: internships.pricing,
      price: internships.price,
      discountPrice: internships.discountPrice,
      currency: internships.currency,
      paymentType: internships.paymentType,
      pricingNote: internships.pricingNote,
    })
    .from(internships)
    .where(
      and(
        eq(internships.isActive, true),
        eq(internships.registrationOpen, true)
      )
    )
    .orderBy(desc(internships.createdAt))
    .limit(limit);

  /* ---------- 5. Shape feed posts ---------- */
  const feedPosts: FeedPost[] = postRows.map((p) => ({
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
    isFollowingAuthor: followingIds.includes(p.authorId),
    isOwnPost: currentUserId === p.authorId,
  }));

  /* ---------- 6. Shape internships ---------- */
  const feedInternships: FeedInternship[] = internshipRows.map((i) => ({
    kind: "internship",
    id: i.id,
    name: i.name,
    description: i.description,
    image: i.image,
    skills: i.skills ?? [],
    qualifications: i.qualifications ?? [],
    duration: i.duration,
    mode: i.mode,
    location: i.location,
    registrationOpen: i.registrationOpen,
    createdAt: i.createdAt.toISOString(),

    pricing: i.pricing,
    price: i.price,
    discountPrice: i.discountPrice,
    currency: i.currency,
    paymentType: i.paymentType,
    pricingNote: i.pricingNote,
  }));

  /* ---------- 7. Merge + sort ---------- */
  const merged: FeedItem[] = [
    ...feedPosts,
    ...feedInternships,
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return merged.slice(0, limit);
}

/* =========================================================
   SUGGESTED USERS
========================================================= */

export async function getSuggestedUsers(
  limit = 3
): Promise<SuggestedUser[]> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        headline: users.headline,
        followersCount: users.followersCount,
      })
      .from(users)
      .orderBy(desc(users.followersCount))
      .limit(limit);
  }

  const followingRows = await db
    .select({ id: followers.followingId })
    .from(followers)
    .where(eq(followers.followerId, currentUserId));
  const followingIds = followingRows.map((r) => r.id);

  const connectionRows = await db
    .select({
      requesterId: connections.requesterId,
      addresseeId: connections.addresseeId,
    })
    .from(connections)
    .where(
      or(
        eq(connections.requesterId, currentUserId),
        eq(connections.addresseeId, currentUserId)
      )
    );

  const connectedIds = connectionRows.flatMap((c) => [
    c.requesterId,
    c.addresseeId,
  ]);

  const excludeIds = Array.from(
    new Set([currentUserId, ...followingIds, ...connectedIds])
  );

  return db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      followersCount: users.followersCount,
    })
    .from(users)
    .where(notInArray(users.id, excludeIds))
    .orderBy(desc(users.followersCount), desc(users.createdAt))
    .limit(limit);
}

/* =========================================================
   TRENDING
========================================================= */

export async function getTrendingTopics(
  limit = 4
): Promise<TrendingTopic[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await db.execute<{ tag: string; count: number }>(sql`
    SELECT tag, COUNT(*)::int AS count
    FROM ${posts},
         jsonb_array_elements_text(${posts.tags}) AS tag
    WHERE ${posts.isDeleted} = false
      AND ${posts.visibility} = 'public'
      AND ${posts.createdAt} >= ${sevenDaysAgo}
    GROUP BY tag
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  return rows.rows.map((r) => ({
    tag: r.tag.startsWith("#") ? r.tag : `#${r.tag}`,
    count: r.count,
  }));
}

/* =========================================================
   UPCOMING
========================================================= */

export async function getUpcomingItems(
  limit = 3
): Promise<UpcomingItem[]> {
  return [];
}

/* =========================================================
   USER STATS
========================================================= */

export async function getSidebarUserStats(): Promise<SidebarUserStats | null> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return null;

  const [userRow] = await db
    .select({
      name: users.name,
      email: users.email,
      image: users.image,
      headline: users.headline,
      followers: users.followersCount,
      following: users.followingCount,
      connections: users.connectionsCount,
    })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!userRow) return null;

  const [internshipRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(internshipRegistrations)
    .where(
      and(
        eq(internshipRegistrations.userId, currentUserId),
        inArray(internshipRegistrations.status, ["active", "completed"])
      )
    );

  const [certRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, currentUserId),
        eq(certificates.status, "issued")
      )
    );

  return {
    internships: internshipRow?.count ?? 0,
    certificates: certRow?.count ?? 0,
    followers: userRow.followers,
    following: userRow.following,
    connections: userRow.connections,
    name: userRow.name,
    email: userRow.email,
    image: userRow.image,
    headline: userRow.headline,
  };
}

/* =========================================================
   FOLLOW USER
========================================================= */

export async function followUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };
  if (currentUserId === targetUserId)
    return { success: false, error: "Cannot follow yourself" };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(followers).values({
        followerId: currentUserId,
        followingId: targetUserId,
      });

      await tx
        .update(users)
        .set({ followingCount: sql`${users.followingCount} + 1` })
        .where(eq(users.id, currentUserId));

      await tx
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, targetUserId));
    });

    return { success: true };
  } catch (err) {
    console.error("followUser error", err);
    return { success: false, error: "Already following or DB error" };
  }
}

/* =========================================================
   SEND CONNECTION REQUEST
========================================================= */

export async function sendConnectionRequest(
  targetUserId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };
  if (currentUserId === targetUserId)
    return { success: false, error: "Cannot connect with yourself" };

  try {
    const [reverseRequest] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.requesterId, targetUserId),
          eq(connections.addresseeId, currentUserId),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (reverseRequest) {
      await db.transaction(async (tx) => {
        await tx
          .update(connections)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(eq(connections.id, reverseRequest.id));

        await tx
          .update(users)
          .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
          .where(eq(users.id, currentUserId));

        await tx
          .update(users)
          .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
          .where(eq(users.id, targetUserId));
      });

      return { success: true };
    }

    await db.insert(connections).values({
      requesterId: currentUserId,
      addresseeId: targetUserId,
      status: "pending",
      message: message ?? null,
    });

    return { success: true };
  } catch (err) {
    console.error("sendConnectionRequest error", err);
    return { success: false, error: "Already requested or DB error" };
  }
}

/* =========================================================
   CURRENT USER PROFILE
========================================================= */

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return null;

  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      headline: users.headline,
      coverImage: users.coverImage,
      connectionsCount: users.connectionsCount,
      followersCount: users.followersCount,
    })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!userRow) return null;

  const [postsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(
      and(eq(posts.userId, currentUserId), eq(posts.isDeleted, false))
    );

  const [internshipsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(internshipRegistrations)
    .where(
      and(
        eq(internshipRegistrations.userId, currentUserId),
        inArray(internshipRegistrations.status, ["active", "completed"])
      )
    );

  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    image: userRow.image,
    headline: userRow.headline,
    coverImage: userRow.coverImage,
    postsCount: postsRow?.count ?? 0,
    connectionsCount: userRow.connectionsCount,
    internshipsCount: internshipsRow?.count ?? 0,
    followersCount: userRow.followersCount,
  };
}

/* =========================================================
   SIDEBAR BADGES
========================================================= */

export async function getSidebarBadges(): Promise<SidebarBadges> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { network: 0, notifications: 0 };

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connections)
    .where(
      and(
        eq(connections.addresseeId, currentUserId),
        eq(connections.status, "pending")
      )
    );

  return {
    network: pendingRow?.count ?? 0,
    notifications: 0,
  };
}

/* =========================================================
   INTERNSHIP REGISTRATION IDS
========================================================= */

export async function getUserRegisteredInternshipIds(): Promise<Set<string>> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return new Set();

  const rows = await db
    .select({ internshipId: internshipRegistrations.internshipId })
    .from(internshipRegistrations)
    .where(eq(internshipRegistrations.userId, currentUserId));

  return new Set(rows.map((r) => r.internshipId));
}

/* =========================================================
   CREATE POST
========================================================= */

export async function createPost(
  input: CreatePostInput
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId)
    return { success: false, error: "Please sign in to create a post" };

  const hasCaption = input.caption.trim().length > 0;
  const hasMedia = input.media.length > 0;

  if (!hasCaption && !hasMedia) {
    return { success: false, error: "Post must have a caption or an image" };
  }

  try {
    const [created] = await db
      .insert(posts)
      .values({
        userId: currentUserId,
        caption: input.caption.trim() || null,
        media: input.media,
        mediaType: input.mediaType,
        visibility: input.visibility,
        location: input.location?.trim() || null,
        tags: input.tags ?? [],
      })
      .returning({ id: posts.id });

    return { success: true, postId: created.id };
  } catch (err) {
    console.error("createPost error", err);
    return { success: false, error: "Failed to create post" };
  }
}

/* =========================================================
   GET PRESIGNED UPLOAD URL
========================================================= */

export async function getUploadUrl(
  fileName: string,
  contentType: string
): Promise<{
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: string;
}> {
   const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;

  if (!userId) return { success: false, error: "Not authenticated" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(contentType))
    return { success: false, error: "Invalid image type" };

  try {
    const key = generateFileKey(userId, fileName);
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

/* =========================================================
   TOGGLE LIKE
========================================================= */

export async function toggleLikePost(postId: string): Promise<{
  success: boolean;
  liked: boolean;
  likesCount: number;
  error?: string;
}> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId)
    return {
      success: false,
      liked: false,
      likesCount: 0,
      error: "Not authenticated",
    };

  try {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(
        and(eq(postLikes.postId, postId), eq(postLikes.userId, currentUserId))
      )
      .limit(1);

    if (existing) {
      await db.transaction(async (tx) => {
        await tx.delete(postLikes).where(eq(postLikes.id, existing.id));
        await tx
          .update(posts)
          .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
          .where(eq(posts.id, postId));
      });

      const [updated] = await db
        .select({ likesCount: posts.likesCount })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      return {
        success: true,
        liked: false,
        likesCount: updated?.likesCount ?? 0,
      };
    }

    await db.transaction(async (tx) => {
      await tx.insert(postLikes).values({ postId, userId: currentUserId });
      await tx
        .update(posts)
        .set({ likesCount: sql`${posts.likesCount} + 1` })
        .where(eq(posts.id, postId));
    });

    const [updated] = await db
      .select({ likesCount: posts.likesCount })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return {
      success: true,
      liked: true,
      likesCount: updated?.likesCount ?? 0,
    };
  } catch (err) {
    console.error("toggleLikePost", err);
    return {
      success: false,
      liked: false,
      likesCount: 0,
      error: "DB error",
    };
  }
}

/* =========================================================
   TOGGLE SAVE
========================================================= */

export async function toggleSavePost(postId: string): Promise<{
  success: boolean;
  saved: boolean;
  error?: string;
}> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId)
    return { success: false, saved: false, error: "Not authenticated" };

  try {
    const [existing] = await db
      .select()
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.postId, postId),
          eq(savedPosts.userId, currentUserId)
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(savedPosts).where(eq(savedPosts.id, existing.id));
      return { success: true, saved: false };
    }

    await db.insert(savedPosts).values({ postId, userId: currentUserId });
    return { success: true, saved: true };
  } catch (err) {
    console.error("toggleSavePost", err);
    return { success: false, saved: false, error: "DB error" };
  }
}

/* =========================================================
   GET SAVED POST IDS
========================================================= */

export async function getSavedPostIds(): Promise<Set<string>> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return new Set();

  const rows = await db
    .select({ postId: savedPosts.postId })
    .from(savedPosts)
    .where(eq(savedPosts.userId, currentUserId));

  return new Set(rows.map((r) => r.postId));
}

/* =========================================================
   UPDATE POST
========================================================= */

export async function updatePost(
  postId: string,
  input: UpdatePostInput
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [post] = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) return { success: false, error: "Post not found" };
    if (post.userId !== currentUserId)
      return { success: false, error: "Not your post" };

    await db
      .update(posts)
      .set({
        caption: input.caption.trim() || null,
        location: input.location?.trim() || null,
        tags: input.tags ?? [],
        visibility: input.visibility,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    return { success: true };
  } catch (err) {
    console.error("updatePost", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   DELETE POST
========================================================= */

export async function deletePost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [post] = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) return { success: false, error: "Post not found" };
    if (post.userId !== currentUserId)
      return { success: false, error: "Not your post" };

    await db
      .update(posts)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(posts.id, postId));

    return { success: true };
  } catch (err) {
    console.error("deletePost", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   GET POST COMMENTS
========================================================= */

export async function getPostComments(
  postId: string
): Promise<PostComment[]> {
  const rows = await db
    .select({
      id: postComments.id,
      content: postComments.content,
      createdAt: postComments.createdAt,
      parentId: postComments.parentId,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorHeadline: users.headline,
    })
    .from(postComments)
    .innerJoin(users, eq(users.id, postComments.userId))
    .where(
      and(eq(postComments.postId, postId), eq(postComments.isDeleted, false))
    )
    .orderBy(postComments.createdAt);

  const flat: PostComment[] = rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    parentId: r.parentId,
    author: {
      id: r.authorId,
      name: r.authorName,
      image: r.authorImage,
      headline: r.authorHeadline,
    },
  }));

  const byId = new Map<string, PostComment>();
  const roots: PostComment[] = [];

  flat.forEach((c) => byId.set(c.id, { ...c, replies: [] }));
  flat.forEach((c) => {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/* =========================================================
   ADD COMMENT
========================================================= */

export async function addComment(
  postId: string,
  content: string,
  parentId?: string | null
): Promise<{ success: boolean; comment?: PostComment; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Comment cannot be empty" };
  if (trimmed.length > 1500)
    return { success: false, error: "Comment too long" };

  try {
    const [created] = await db
      .insert(postComments)
      .values({
        postId,
        userId: currentUserId,
        content: trimmed,
        parentId: parentId ?? null,
      })
      .returning();

    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, postId));

    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        headline: users.headline,
      })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    return {
      success: true,
      comment: {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        parentId: created.parentId,
        author,
        replies: [],
      },
    };
  } catch (err) {
    console.error("addComment", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   DELETE COMMENT
========================================================= */

export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [comment] = await db
      .select({ userId: postComments.userId, postId: postComments.postId })
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment) return { success: false, error: "Not found" };
    if (comment.userId !== currentUserId)
      return { success: false, error: "Not your comment" };

    await db.transaction(async (tx) => {
      await tx
        .update(postComments)
        .set({ isDeleted: true })
        .where(eq(postComments.id, commentId));
      await tx
        .update(posts)
        .set({ commentsCount: sql`GREATEST(${posts.commentsCount} - 1, 0)` })
        .where(eq(posts.id, comment.postId));
    });

    return { success: true };
  } catch (err) {
    console.error("deleteComment", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   UNFOLLOW USER
========================================================= */

export async function unfollowUser(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };
  if (currentUserId === targetUserId)
    return { success: false, error: "Cannot unfollow yourself" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, currentUserId),
            eq(followers.followingId, targetUserId)
          )
        );

      await tx
        .update(users)
        .set({
          followingCount: sql`GREATEST(${users.followingCount} - 1, 0)`,
        })
        .where(eq(users.id, currentUserId));

      await tx
        .update(users)
        .set({
          followersCount: sql`GREATEST(${users.followersCount} - 1, 0)`,
        })
        .where(eq(users.id, targetUserId));
    });

    return { success: true };
  } catch (err) {
    console.error("unfollowUser", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   ACCEPT CONNECTION REQUEST
========================================================= */

export async function acceptConnectionRequest(
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [conn] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.requesterId, requesterId),
          eq(connections.addresseeId, currentUserId),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (!conn) return { success: false, error: "Request not found" };

    await db.transaction(async (tx) => {
      await tx
        .update(connections)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(connections.id, conn.id));

      await tx
        .update(users)
        .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
        .where(eq(users.id, currentUserId));

      await tx
        .update(users)
        .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
        .where(eq(users.id, requesterId));
    });

    return { success: true };
  } catch (err) {
    console.error("acceptConnectionRequest", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   REMOVE CONNECTION
========================================================= */

export async function removeConnection(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [conn] = await db
      .select()
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
          eq(connections.status, "accepted")
        )
      )
      .limit(1);

    if (!conn) return { success: false, error: "Connection not found" };

    await db.transaction(async (tx) => {
      await tx.delete(connections).where(eq(connections.id, conn.id));

      await tx
        .update(users)
        .set({
          connectionsCount: sql`GREATEST(${users.connectionsCount} - 1, 0)`,
        })
        .where(eq(users.id, currentUserId));

      await tx
        .update(users)
        .set({
          connectionsCount: sql`GREATEST(${users.connectionsCount} - 1, 0)`,
        })
        .where(eq(users.id, targetUserId));
    });

    return { success: true };
  } catch (err) {
    console.error("removeConnection", err);
    return { success: false, error: "DB error" };
  }
}