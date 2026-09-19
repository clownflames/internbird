import { auth } from "@/auth";
import { headers } from "next/headers";
import { successResponse, errorResponse, handleApiError } from "@/lib/mobile";

export async function POST() {
  try {
    const result = await auth.api.signOut({
      headers: await headers(),
    });

    return successResponse(result, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}