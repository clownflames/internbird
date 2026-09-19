import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/mobile";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const result = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe ?? true,
      },
    });

    if (!result.user) {
      return errorResponse("Invalid credentials", 401);
    }

    return successResponse({ user: result.user, token: result.token }, "Login successful");
  } catch (error) {
    return handleApiError(error);
  }
}