"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import {
  posts,
  users,
  internships,
  postLikes,
  followers,
  savedPosts,
} from "@/db/schema";
import { auth } from "@/auth"; // better-auth server instance
import {
  and,
  eq,
  desc,
  sql,
  inArray,
  or,
} from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

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
  location: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEdited?: boolean;
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
  isOwnPost?: boolean;
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

  pricing: "free" | "paid";
  price: string | null;
  discountPrice: string | null;
  currency: string;
  paymentType: "one_time" | "monthly" | null;
  pricingNote: string | null;

  registrationOpen: boolean;
  createdAt: string;
};
export type FeedItem = FeedPost | FeedInternship;

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/* =========================================================
   GET HOME FEED
========================================================= */

export async function getHomeFeed(
  limit = 20,
  offset = 0
): Promise<{ items: FeedItem[]; hasMore: boolean }> {
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
      location: posts.location,
      tags: posts.tags,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      sharesCount: posts.sharesCount,
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
    .limit(limit + 1)
    .offset(offset);

  /* ---------- 3. Liked + Saved IDs ---------- */
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

  /* ---------- 4. Fetch internships ---------- */
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

      pricing: internships.pricing,
      price: internships.price,
      discountPrice: internships.discountPrice,
      currency: internships.currency,
      paymentType: internships.paymentType,
      pricingNote: internships.pricingNote,

      registrationOpen: internships.registrationOpen,
      createdAt: internships.createdAt,
    })
    .from(internships)
    .where(
      and(
        eq(internships.isActive, true),
        eq(internships.registrationOpen, true)
      )
    )
    .orderBy(desc(internships.createdAt))
    .limit(limit + 1)
    .offset(offset);

  /* ---------- 5. hasMore ---------- */
  const hasMorePosts = postRows.length > limit;
  const hasMoreInternships = internshipRows.length > limit;
  const hasMore = hasMorePosts || hasMoreInternships;

  const trimmedPosts = postRows.slice(0, limit);
  const trimmedInternships = internshipRows.slice(0, limit);

  /* ---------- 6. Shape posts ---------- */
  const feedPosts: FeedPost[] = trimmedPosts.map((p) => ({
    kind: "post",
    id: p.id,
    caption: p.caption,
    media: p.media ?? [],
    mediaType: p.mediaType,
    location: p.location,
    tags: p.tags ?? [],
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    sharesCount: p.sharesCount,
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
  }));

  /* ---------- 7. Shape internships ---------- */
  const feedInternships: FeedInternship[] = trimmedInternships.map((i) => ({
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

    pricing: i.pricing,
    price: i.price,
    discountPrice: i.discountPrice,
    currency: i.currency,
    paymentType: i.paymentType,
    pricingNote: i.pricingNote,

    registrationOpen: i.registrationOpen,
    createdAt: i.createdAt.toISOString(),
  }));

  /* ---------- 8. Merge + sort ---------- */
  const merged: FeedItem[] = [...feedPosts, ...feedInternships].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { items: merged, hasMore };
}