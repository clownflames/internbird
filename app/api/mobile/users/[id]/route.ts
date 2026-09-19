import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, followers, connections, posts, internshipRegistrations, certificates, offerLetters } from "@/db/schema";
import { eq, count, and, or, desc } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const userId = url.searchParams.get("id") || session.user.id;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return errorResponse("User not found", 404);

    const isOwnProfile = userId === session.user.id;

    const [
      followersCount,
      followingCount,
      connectionsCount,
      postsCount,
      internshipsCount,
      certificatesCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(followers).where(and(eq(followers.followingId, userId), eq(followers.status, "active"))),
      db.select({ count: count() }).from(followers).where(and(eq(followers.followerId, userId), eq(followers.status, "active"))),
      db.select({ count: count() }).from(connections).where(and(or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)), eq(connections.status, "accepted"))),
      db.select({ count: count() }).from(posts).where(and(eq(posts.userId, userId), eq(posts.isDeleted, false))),
      db.select({ count: count() }).from(internshipRegistrations).where(and(eq(internshipRegistrations.userId, userId), eq(internshipRegistrations.status, "active"))),
      db.select({ count: count() }).from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.status, "issued"))),
    ]);

    return successResponse({
      user: user[0],
      stats: {
        followers: followersCount[0]?.count || 0,
        following: followingCount[0]?.count || 0,
        connections: connectionsCount[0]?.count || 0,
        posts: postsCount[0]?.count || 0,
        internships: internshipsCount[0]?.count || 0,
        certificates: certificatesCount[0]?.count || 0,
      },
      isOwnProfile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}