import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, followers, connections } from "@/db/schema";
import { eq, and, or, desc, ilike, ne, inArray, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const where = query
      ? and(
          ne(users.id, session.user.id),
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.headline, `%${query}%`),
            ilike(users.bio, `%${query}%`)
          )
        )
      : ne(users.id, session.user.id);

    const [results, totalResult] = await Promise.all([
      db.select({
        id: users.id,
        name: users.name,
        image: users.image,
        headline: users.headline,
        location: users.location,
        followersCount: users.followersCount,
        followingCount: users.followingCount,
        connectionsCount: users.connectionsCount,
      }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(users).where(where),
    ]);

    const total = totalResult[0]?.count || 0;

    const followingIds = new Set();
    if (results.length > 0) {
      const followRows = await db.select({ followingId: followers.followingId })
        .from(followers)
        .where(and(eq(followers.followerId, session.user.id), eq(followers.status, "active"), inArray(followers.followingId, results.map(r => r.id))));
      followRows.forEach(r => followingIds.add(r.followingId));

      const connRows = await db.select({ addresseeId: connections.addresseeId })
        .from(connections)
        .where(and(eq(connections.requesterId, session.user.id), eq(connections.status, "accepted"), inArray(connections.addresseeId, results.map(r => r.id))));
      connRows.forEach(r => followingIds.add(r.addresseeId));

      const connRows2 = await db.select({ requesterId: connections.requesterId })
        .from(connections)
        .where(and(eq(connections.addresseeId, session.user.id), eq(connections.status, "accepted"), inArray(connections.requesterId, results.map(r => r.id))));
      connRows2.forEach(r => followingIds.add(r.requesterId));
    }

    const usersWithFollowStatus = results.map(u => ({
      ...u,
      isFollowing: followingIds.has(u.id),
      isConnected: followingIds.has(u.id), // simplified - connection is mutual
    }));

    return successResponse(usersWithFollowStatus, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}