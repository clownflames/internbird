import { auth } from "@/auth";
import { headers } from "next/headers";
import { successResponse, errorResponse, handleApiError, unauthorizedResponse } from "@/lib/mobile";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return unauthorizedResponse();

    const body = await request.json();
    const result = await auth.api.refreshToken({
      body: {
        accountId: body.accountId,
        useAccountCookie: body.useAccountCookie ?? false,
      },
      headers: await headers(),
    });

    return successResponse({ accessToken: result.accessToken, refreshToken: result.refreshToken }, "Token refreshed");
  } catch (error) {
    return handleApiError(error);
  }
}