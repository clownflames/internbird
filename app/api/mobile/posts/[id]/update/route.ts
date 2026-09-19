import { auth } from "@/auth";
import { posts } from "@/db/schema";
import {
  db,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/mobile";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UpdatePostBody {
  caption?: string;
  location?: string;
  visibility?: string;
  tags?: string[];
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const data: UpdatePostBody = await req.json();

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!post) {
      return notFoundResponse();
    }

    if (post.userId !== session.user.id) {
      return errorResponse("Not authorized", 403);
    }

    await db
      .update(posts)
      .set({
        caption: data.caption,
        location: data.location,
        tags: data.tags,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    return successResponse({
      updated: true,
    });
  } catch (error) {
    console.error("Update post error:", error);

    return errorResponse("Failed to update post", 500);
  }
}