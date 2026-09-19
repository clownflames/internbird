import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const [results, totalResult] = await Promise.all([
      db.select().from(payments).where(eq(payments.userId, session.user.id)).orderBy(desc(payments.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(payments).where(eq(payments.userId, session.user.id)),
    ]);

    return successResponse(results.map(r => ({ ...r, amount: r.amount.toString() })), undefined, { page, limit, total: totalResult[0]?.count || 0, totalPages: Math.ceil((totalResult[0]?.count || 0) / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}