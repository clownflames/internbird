"use server";

import { db } from "@/db";
import {
  users,
  connections,
  followers,
} from "@/db/schema";
import { auth } from "@/auth";
import {
  and,
  or,
  eq,
  ne,
  desc,
  sql,
  inArray,
  notInArray,
} from "drizzle-orm";

/* =========================================================
   TYPES
========================================================= */

export type NetworkUser = {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  location: string | null;
  followersCount: number;
  connectionsCount: number;
  connectionId?: string; // for pending requests (to accept/reject)
};

export type NetworkData = {
  connections: NetworkUser[];
  pendingReceived: NetworkUser[]; // requests I received
  pendingSent: NetworkUser[];     // requests I sent
  suggestions: NetworkUser[];
  followers: NetworkUser[];       // people who follow me
  following: NetworkUser[];       // people I follow
  counts: {
    connections: number;
    pending: number;
    followers: number;
    following: number;
  };
};

/* =========================================================
   HELPER
========================================================= */

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/* =========================================================
   GET NETWORK DATA
========================================================= */

export async function getNetworkData(): Promise<NetworkData> {
  const currentUserId = await getCurrentUserId();

  const empty: NetworkData = {
    connections: [],
    pendingReceived: [],
    pendingSent: [],
    suggestions: [],
    followers: [],
    following: [],
    counts: { connections: 0, pending: 0, followers: 0, following: 0 },
  };

  if (!currentUserId) return empty;

  /* ---------- 1. Accepted connections ---------- */
  const connectionRows = await db
    .select({
      connectionId: connections.id,
      requesterId: connections.requesterId,
      addresseeId: connections.addresseeId,
    })
    .from(connections)
    .where(
      and(
        or(
          eq(connections.requesterId, currentUserId),
          eq(connections.addresseeId, currentUserId)
        ),
        eq(connections.status, "accepted")
      )
    );

  // get "other user" id for each connection
  const connectionUserIds = connectionRows.map((c) =>
    c.requesterId === currentUserId ? c.addresseeId : c.requesterId
  );

  const connectionUsers: NetworkUser[] =
    connectionUserIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            image: users.image,
            headline: users.headline,
            location: users.location,
            followersCount: users.followersCount,
            connectionsCount: users.connectionsCount,
          })
          .from(users)
          .where(inArray(users.id, connectionUserIds))
      : [];

  /* ---------- 2. Pending received ---------- */
  const receivedRows = await db
    .select({
      connectionId: connections.id,
      userId: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      location: users.location,
      followersCount: users.followersCount,
      connectionsCount: users.connectionsCount,
    })
    .from(connections)
    .innerJoin(users, eq(users.id, connections.requesterId))
    .where(
      and(
        eq(connections.addresseeId, currentUserId),
        eq(connections.status, "pending")
      )
    )
    .orderBy(desc(connections.createdAt));

  const pendingReceived: NetworkUser[] = receivedRows.map((r) => ({
    id: r.userId,
    name: r.name,
    image: r.image,
    headline: r.headline,
    location: r.location,
    followersCount: r.followersCount,
    connectionsCount: r.connectionsCount,
    connectionId: r.connectionId,
  }));

  /* ---------- 3. Pending sent ---------- */
  const sentRows = await db
    .select({
      connectionId: connections.id,
      userId: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      location: users.location,
      followersCount: users.followersCount,
      connectionsCount: users.connectionsCount,
    })
    .from(connections)
    .innerJoin(users, eq(users.id, connections.addresseeId))
    .where(
      and(
        eq(connections.requesterId, currentUserId),
        eq(connections.status, "pending")
      )
    )
    .orderBy(desc(connections.createdAt));

  const pendingSent: NetworkUser[] = sentRows.map((r) => ({
    id: r.userId,
    name: r.name,
    image: r.image,
    headline: r.headline,
    location: r.location,
    followersCount: r.followersCount,
    connectionsCount: r.connectionsCount,
    connectionId: r.connectionId,
  }));

  /* ---------- 4. Suggestions ---------- */
  // exclude: self + already connected + already pending (either direction)
  //         + already following
  const followingRows = await db
    .select({ id: followers.followingId })
    .from(followers)
    .where(eq(followers.followerId, currentUserId));

  const followingIds = followingRows.map((r) => r.id);

  const allConnectionRows = await db
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

  const connectedIds = allConnectionRows.flatMap((c) => [
    c.requesterId,
    c.addresseeId,
  ]);

  const excludeIds = Array.from(
    new Set([currentUserId, ...followingIds, ...connectedIds])
  );

  const suggestions =
    excludeIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            image: users.image,
            headline: users.headline,
            location: users.location,
            followersCount: users.followersCount,
            connectionsCount: users.connectionsCount,
          })
          .from(users)
          .where(notInArray(users.id, excludeIds))
          .orderBy(desc(users.followersCount), desc(users.createdAt))
          .limit(12)
      : [];

  /* ---------- 5. Followers (who follows me) ---------- */
  const followerRows = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      location: users.location,
      followersCount: users.followersCount,
      connectionsCount: users.connectionsCount,
    })
    .from(followers)
    .innerJoin(users, eq(users.id, followers.followerId))
    .where(eq(followers.followingId, currentUserId))
    .orderBy(desc(followers.createdAt));

  /* ---------- 6. Following (whom I follow) ---------- */
  const followingUsers = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      headline: users.headline,
      location: users.location,
      followersCount: users.followersCount,
      connectionsCount: users.connectionsCount,
    })
    .from(followers)
    .innerJoin(users, eq(users.id, followers.followingId))
    .where(eq(followers.followerId, currentUserId))
    .orderBy(desc(followers.createdAt));

  /* ---------- 7. Counts ---------- */
  const counts = {
    connections: connectionUsers.length,
    pending: pendingReceived.length,
    followers: followerRows.length,
    following: followingUsers.length,
  };

  return {
    connections: connectionUsers,
    pendingReceived,
    pendingSent,
    suggestions,
    followers: followerRows,
    following: followingUsers,
    counts,
  };
}

/* =========================================================
   ACCEPT CONNECTION REQUEST
========================================================= */

export async function acceptConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    // ensure it's addressed to me
    const [row] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.addresseeId, currentUserId),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (!row) return { success: false, error: "Request not found" };

    await db.transaction(async (tx) => {
      await tx
        .update(connections)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(connections.id, connectionId));

      // bump counts for both users
      await tx
        .update(users)
        .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
        .where(eq(users.id, currentUserId));

      await tx
        .update(users)
        .set({ connectionsCount: sql`${users.connectionsCount} + 1` })
        .where(eq(users.id, row.requesterId));
    });

    return { success: true };
  } catch (err) {
    console.error("acceptConnection", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   REJECT CONNECTION REQUEST
========================================================= */

export async function rejectConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    const [row] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.addresseeId, currentUserId),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (!row) return { success: false, error: "Request not found" };

    await db
      .update(connections)
      .set({ status: "rejected" })
      .where(eq(connections.id, connectionId));

    return { success: true };
  } catch (err) {
    console.error("rejectConnection", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   WITHDRAW SENT REQUEST
========================================================= */

export async function withdrawConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { success: false, error: "Not authenticated" };

  try {
    await db
      .delete(connections)
      .where(
        and(
          eq(connections.id, connectionId),
          eq(connections.requesterId, currentUserId),
          eq(connections.status, "pending")
        )
      );

    return { success: true };
  } catch (err) {
    console.error("withdrawConnection", err);
    return { success: false, error: "DB error" };
  }
}

/* =========================================================
   TOGGLE FOLLOW
========================================================= */

export async function toggleFollow(
  targetUserId: string
): Promise<{ success: boolean; following: boolean; error?: string }> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId)
    return { success: false, following: false, error: "Not authenticated" };

  if (currentUserId === targetUserId)
    return { success: false, following: false, error: "Cannot follow self" };

  try {
    // already following?
    const [existing] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, currentUserId),
          eq(followers.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existing) {
      // unfollow
      await db.transaction(async (tx) => {
        await tx
          .delete(followers)
          .where(eq(followers.id, existing.id));

        await tx
          .update(users)
          .set({ followingCount: sql`${users.followingCount} - 1` })
          .where(eq(users.id, currentUserId));

        await tx
          .update(users)
          .set({ followersCount: sql`${users.followersCount} - 1` })
          .where(eq(users.id, targetUserId));
      });

      return { success: true, following: false };
    }

    // follow
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

    return { success: true, following: true };
  } catch (err) {
    console.error("toggleFollow", err);
    return { success: false, following: false, error: "DB error" };
  }
}