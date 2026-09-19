import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { postComments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, notFoundResponse, validateBody } from "@/lib/mobile";
import { createCommentSchema } from "@/lib/mobile/validation";

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(createCommentSchema)(request);

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const commentId = pathParts[pathParts.length - 3];

    const comment = await db.select().from(postComments).where(eq(postComments.id, commentId)).limit(1);
    if (!comment[0]) return notFoundResponse("Comment not found");
    if (comment[0].userId !== session.user.id) return errorResponse("Not authorized", 403);

    await db.update(postComments).set({ content: data.content, isEdited: true, updatedAt: new Date() }).where(eq(postComments.id, commentId));

    return successResponse({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}