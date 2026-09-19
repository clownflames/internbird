import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse, validateBody } from "@/lib/mobile";
import { updateProfileSchema } from "@/lib/mobile/validation";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user[0]) return errorResponse("User not found", 404);

    return successResponse(user[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const data = await validateBody(updateProfileSchema)(request);

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.dob) updateData.dob = new Date(data.dob);
    if (data.phone !== undefined) updateData.phone = data.phone;

    updateData.updatedAt = new Date();

    await db.update(users).set(updateData).where(eq(users.id, session.user.id));

    const updatedUser = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    return successResponse(updatedUser[0], "Profile updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}