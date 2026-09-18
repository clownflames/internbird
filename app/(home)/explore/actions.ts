"use server";

import { db } from "@/db";
import {
  users,
  posts,
  internships,
  postLikes,
  savedPosts,
  followers,
  connections,
} from "@/db/schema";
import { getSession } from "@/auth";
import {
  and,
  or,
  eq,
  desc,
  sql,
  inArray,
  ilike,
  notInArray,
} from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type TrendingTag = {
  tag: string;
  count: number;
};

export type PopularUser = {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  followersCount: number;
  connectionsCount: number;
};

export type ExplorePost = {
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

export type ExploreInternship = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  skills: string[];
  duration: string | null;
  mode: "remote" | "onsite" | "hybrid";
  location: string | null;

  // pricing
  pricing: "free" | "paid";
  price: string | null;
  discountPrice: string | null;
  currency: string | null;
  paymentType: "one_time" | "monthly" | null;
  pricingNote: string | null;
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

/* =========================================================
   1. TRENDING TAGS
========================================================= */

export async function getTrendingTags(limit = 12): Promise<TrendingTag[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db.execute<{ tag: string; count: number }>(sql`
    SELECT tag, COUNT(*)::int AS count
    FROM ${posts},
         jsonb_array_elements_text(${posts.tags}) AS tag
    WHERE ${posts.isDeleted} = false
      AND ${posts.visibility} = 'public'
      AND ${posts.createdAt} >= ${thirtyDaysAgo}
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
   2. POPULAR USERS / SEARCH USERS
========================================================= */

export async function getPopularUsers(
  limit = 6,
  query?: string
): Promise<PopularUser[]> {
  const currentUserId = await getCurrentUserId();

  if (query && query.trim()) {
    return searchUsers(query, limit * 4);
  }

  if (!currentUserId) {
    return db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        headline: users.headline,
        followersCount: users.followersCount,
        connectionsCount: users.connectionsCount,
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
      connectionsCount: users.connectionsCount,
    })
    .from(users)
    .where(notInArray(users.id, excludeIds))
    .orderBy(desc(users.followersCount), desc(users.createdAt))
    .limit(limit);
}

/* =========================================================
   3. SEARCH USERS
========================================================= */

export async function searchUsers(
  query: string,
  limit = 20
): Promise<PopularUser[]> {
  const currentUserId = await getCurrentUserId();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = `%${trimmed}%`;

  const conditions = [or(ilike(users.name, q), ilike(users.headline, q))!];

  if (currentUserId) {
    conditions.push(notInArray(users.id, [currentUserId]));
  }

  return db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      followersCount: users.followersCount,
      connectionsCount: users.connectionsCount,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.followersCount))
    .limit(limit);
}

/* =========================================================
   4. EXPLORE POSTS
========================================================= */

export async function getExplorePosts(
  options: { tag?: string; query?: string; limit?: number } = {}
): Promise<ExplorePost[]> {
  const { tag, query, limit = 30 } = options;
  const currentUserId = await getCurrentUserId();

  const conditions = [
    eq(posts.isDeleted, false),
    eq(posts.visibility, "public"),
  ];

  if (tag && tag.trim()) {
    const cleanTag = tag.trim().replace(/^#/, "").toLowerCase();
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(${posts.tags}) AS t
        WHERE LOWER(REPLACE(t, '#', '')) = ${cleanTag}
      )` as any
    );
  }

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(posts.caption, q),
        ilike(users.name, q),
        ilike(users.headline, q),
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${posts.tags}) AS t
          WHERE t ILIKE ${q}
        )` as any
      )!
    );
  }

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
    .where(and(...conditions))
    .orderBy(desc(posts.likesCount), desc(posts.createdAt))
    .limit(limit);

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

  return postRows.map((p) => ({
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
    isFollowingAuthor: false,
    isOwnPost: currentUserId === p.authorId,
  }));
}

/* =========================================================
   5. TRENDING INTERNSHIPS (WITH PRICING)
========================================================= */

export async function getExploreInternships(
  limit = 8,
  query?: string
): Promise<ExploreInternship[]> {
  const conditions = [
    eq(internships.isActive, true),
    eq(internships.registrationOpen, true),
  ];

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(internships.name, q),
        ilike(internships.description, q),
        ilike(internships.location, q)
      )!
    );
  }

  const rows = await db
    .select({
      id: internships.id,
      name: internships.name,
      description: internships.description,
      image: internships.image,
      skills: internships.skills,
      duration: internships.duration,
      mode: internships.mode,
      location: internships.location,

      // 👇 pricing columns
      pricing: internships.pricing,
      price: internships.price,
      discountPrice: internships.discountPrice,
      currency: internships.currency,
      paymentType: internships.paymentType,
      pricingNote: internships.pricingNote,
    })
    .from(internships)
    .where(and(...conditions))
    .orderBy(desc(internships.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    image: r.image,
    skills: r.skills ?? [],
    duration: r.duration,
    mode: r.mode,
    location: r.location,

    // 👇 pricing (with fallbacks)
    pricing: r.pricing,
    price: r.price,
    discountPrice: r.discountPrice,
    currency: r.currency ?? "INR",
    paymentType: r.paymentType ?? "one_time",
    pricingNote: r.pricingNote,
  }));
}