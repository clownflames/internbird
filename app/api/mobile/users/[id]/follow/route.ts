import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, followers, connections } from "@/db/schema";
import { eq, and, or, count, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const targetId = url.searchParams.get("id");
    if (!targetId) return errorResponse("Target user ID required", 400);
    if (targetId === session.user.id) return errorResponse("Cannot follow yourself", 400);

    const targetUser = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!targetUser[0]) return notFoundResponse("User not found");

    const existing = await db.select().from(followers).where(and(eq(followers.followerId, session.user.id), eq(followers.followingId, targetId))).limit(1);

    if (existing[0]) {
      if (existing[0].status === "active") {
        await db.update(followers).set({ status: "blocked" }).where(eq(followers.id, existing[0].id));
        await db.update(users).set({ followersCount: sql`${users.followersCount} - 1` }).where(eq(users.id, targetId));
        await db.update(users).set({ followingCount: sql`${users.followingCount} - 1` }).where(eq(users.id, session.user.id));
        return successResponse({ following: false }, "Unfollowed");
      } else {
        await db.update(followers).set({ status: "active" }).where(eq(followers.id, existing[0].id));
        await db.update(users).set({ followersCount: sql`${users.followersCount} + 1` }).where(eq(users.id, targetId));
        await db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, session.user.id));
        return successResponse({ following: true }, "Followed");
      }
    }

    await db.insert(followers).values({
      followerId: session.user.id,
      followingId: targetId,
      status: "active",
    });
    await db.update(users).set({ followersCount: sql`${users.followersCount} + 1` }).where(eq(users.id, targetId));
    await db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, session.user.id));

    return successResponse({ following: true }, "Followed");
  } catch (error) {
    return handleApiError(error);
  }
}