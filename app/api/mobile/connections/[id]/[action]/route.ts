import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { connections, users } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const connectionId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    const connection = await db.select().from(connections).where(eq(connections.id, connectionId)).limit(1);
    if (!connection[0]) return notFoundResponse("Connection not found");

    const conn = connection[0];

    if (action === "accept") {
      if (conn.addresseeId !== session.user.id) return errorResponse("Not authorized", 403);
      if (conn.status !== "pending") return errorResponse("Already processed", 400);

      await db.update(connections).set({ status: "accepted", acceptedAt: new Date() }).where(eq(connections.id, connectionId));
      return successResponse({ status: "accepted" }, "Connection accepted");
    }

    if (action === "reject") {
      if (conn.addresseeId !== session.user.id) return errorResponse("Not authorized", 403);
      if (conn.status !== "pending") return errorResponse("Already processed", 400);

      await db.delete(connections).where(eq(connections.id, connectionId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.requesterId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.addresseeId));
      return successResponse({ status: "rejected" }, "Connection rejected");
    }

    if (action === "cancel") {
      if (conn.requesterId !== session.user.id) return errorResponse("Not authorized", 403);
      if (conn.status !== "pending") return errorResponse("Cannot cancel", 400);

      await db.delete(connections).where(eq(connections.id, connectionId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.requesterId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.addresseeId));
      return successResponse({ status: "cancelled" }, "Request cancelled");
    }

    if (action === "remove") {
      if (conn.requesterId !== session.user.id && conn.addresseeId !== session.user.id) return errorResponse("Not authorized", 403);
      if (conn.status !== "accepted") return errorResponse("Not a connection", 400);

      await db.delete(connections).where(eq(connections.id, connectionId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.requesterId));
      await db.update(users).set({ connectionsCount: sql`${users.connectionsCount} - 1` }).where(eq(users.id, conn.addresseeId));
      return successResponse({ status: "removed" }, "Connection removed");
    }

    return errorResponse("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}