import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse } from "@/lib/mobile";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2];

    const payment = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.userId, session.user.id))).limit(1);
    if (!payment[0]) return notFoundResponse("Payment not found");

    return successResponse({ ...payment[0], amount: payment[0].amount.toString() });
  } catch (error) {
    return handleApiError(error);
  }
}