import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/mobile";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(150),
  phone: z.string().max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: "/",
      },
    });

    if (!result.user) {
      return errorResponse("Registration failed", 400);
    }

    return successResponse({ user: result.user, token: result.token }, "Registration successful");
  } catch (error) {
    return handleApiError(error);
  }
}