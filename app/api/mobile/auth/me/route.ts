import { auth } from "@/auth";
import { headers } from "next/headers";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return unauthorizedResponse();
    }

    return successResponse({
      user: session.user,
      session: session.session,
    });
  } catch (error) {
    return handleApiError(error);
  }
}