import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, followers, connections } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const userId = url.searchParams.get("id") || session.user.id;
    const type = url.searchParams.get("type") || "followers";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let results: any[] = [];
    let total = 0;

    if (type === "followers") {
      const [followRows, totalResult] = await Promise.all([
        db.select({
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
          location: users.location,
        })
        .from(followers)
        .innerJoin(users, eq(followers.followerId, users.id))
        .where(and(eq(followers.followingId, userId), eq(followers.status, "active")))
        .orderBy(desc(followers.createdAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(followers).where(and(eq(followers.followingId, userId), eq(followers.status, "active"))),
      ]);
      results = followRows;
      total = totalResult[0]?.count || 0;
    } else if (type === "following") {
      const [followRows, totalResult] = await Promise.all([
        db.select({
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
          location: users.location,
        })
        .from(followers)
        .innerJoin(users, eq(followers.followingId, users.id))
        .where(and(eq(followers.followerId, userId), eq(followers.status, "active")))
        .orderBy(desc(followers.createdAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(followers).where(and(eq(followers.followerId, userId), eq(followers.status, "active"))),
      ]);
      results = followRows;
      total = totalResult[0]?.count || 0;
    } else if (type === "connections") {
      const [connRows, totalResult] = await Promise.all([
        db.select({
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
          location: users.location,
        })
        .from(connections)
        .innerJoin(users, eq(connections.requesterId, users.id))
        .where(and(eq(connections.addresseeId, userId), eq(connections.status, "accepted")))
        .orderBy(desc(connections.acceptedAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(connections).where(and(eq(connections.addresseeId, userId), eq(connections.status, "accepted"))),
      ]);
      const [connRows2] = await Promise.all([
        db.select({
          id: users.id,
          name: users.name,
          image: users.image,
          headline: users.headline,
          location: users.location,
        })
        .from(connections)
        .innerJoin(users, eq(connections.addresseeId, users.id))
        .where(and(eq(connections.requesterId, userId), eq(connections.status, "accepted")))
        .orderBy(desc(connections.acceptedAt))
        .limit(limit)
        .offset(offset),
      ]);
      results = [...connRows, ...connRows2];
      total = totalResult[0]?.count || 0;
    }

    return successResponse(results, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}