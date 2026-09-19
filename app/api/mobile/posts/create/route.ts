import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, validateBody } from "@/lib/mobile";
import { createPostSchema } from "@/lib/mobile/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(createPostSchema)(request);

    const [post] = await db.insert(posts).values({
      userId: session.user.id,
      caption: data.caption,
      media: data.media || [],
      mediaType: data.mediaType,
      visibility: data.visibility,
      location: data.location,
      tags: data.tags || [],
    }).returning();

    return successResponse(post, "Post created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}