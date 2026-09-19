import { auth } from "@/auth";
import { posts } from "@/db/schema";
import { db, errorResponse, notFoundResponse, successResponse, unauthorizedResponse } from "@/lib/mobile";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PUT(req, { params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return unauthorizedResponse();

  const data = await req.json();
  const [post] = await db.select().from(posts).where(eq(posts.id, params.id)).limit(1);
  if (!post) return notFoundResponse();
  if (post.userId !== session.user.id) return errorResponse("Not authorized", 403);

  await db.update(posts).set({
    caption: data.caption,
    location: data.location,
    visibility: data.visibility,
    tags: data.tags,
    isEdited: true,
    updatedAt: new Date(),
  }).where(eq(posts.id, params.id));

  return successResponse({ updated: true });
}