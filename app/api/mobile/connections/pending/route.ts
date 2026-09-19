import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { connections, users } from "@/db/schema";
import { eq, and, or, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "received";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    let results: any[] = [];
    let total = 0;

    if (type === "pending") {
      const [connRows, totalResult] = await Promise.all([
        db.select({
          id: connections.id,
          status: connections.status,
          message: connections.message,
          createdAt: connections.createdAt,
          requester: {
            id: users.id,
            name: users.name,
            image: users.image,
            headline: users.headline,
          },
        })
        .from(connections)
        .innerJoin(users, eq(connections.requesterId, users.id))
        .where(and(eq(connections.addresseeId, session.user.id), eq(connections.status, "pending")))
        .orderBy(desc(connections.createdAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(connections).where(and(eq(connections.addresseeId, session.user.id), eq(connections.status, "pending"))),
      ]);
      results = connRows;
      total = totalResult[0]?.count || 0;
    } else if (type === "sent") {
      const [connRows, totalResult] = await Promise.all([
        db.select({
          id: connections.id,
          status: connections.status,
          message: connections.message,
          createdAt: connections.createdAt,
          addressee: {
            id: users.id,
            name: users.name,
            image: users.image,
            headline: users.headline,
          },
        })
        .from(connections)
        .innerJoin(users, eq(connections.addresseeId, users.id))
        .where(and(eq(connections.requesterId, session.user.id), eq(connections.status, "pending")))
        .orderBy(desc(connections.createdAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(connections).where(and(eq(connections.requesterId, session.user.id), eq(connections.status, "pending"))),
      ]);
      results = connRows;
      total = totalResult[0]?.count || 0;
    }

    return successResponse(results, undefined, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}