import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, connections } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { connectionRequestSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(connectionRequestSchema)(request);
    const { addresseeId, message } = data;

    if (addresseeId === session.user.id) return errorResponse("Cannot connect with yourself", 400);

    const targetUser = await db.select().from(users).where(eq(users.id, addresseeId)).limit(1);
    if (!targetUser[0]) return notFoundResponse("User not found");

    const existing = await db.select().from(connections).where(
      or(
        and(eq(connections.requesterId, session.user.id), eq(connections.addresseeId, addresseeId)),
        and(eq(connections.requesterId, addresseeId), eq(connections.addresseeId, session.user.id))
      )
    ).limit(1);

    if (existing[0]) {
      if (existing[0].status === "pending" && existing[0].requesterId === session.user.id) {
        await db.delete(connections).where(eq(connections.id, existing[0].id));
        return successResponse({ status: "cancelled" }, "Connection request cancelled");
      }
      return errorResponse("Connection already exists or pending", 400);
    }

    await db.insert(connections).values({
      requesterId: session.user.id,
      addresseeId,
      status: "pending",
      message,
    });

    await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} + 1` }).where(eq(users.id, session.user.id));
    await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} + 1` }).where(eq(users.id, addresseeId));

    return successResponse({ status: "pending" }, "Connection request sent");
  } catch (error) {
    return handleApiError(error);
  }
}