"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth"; // better-auth server instance
import { APIError } from "better-auth/api";

/* =========================================================
   VALIDATION
========================================================= */

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(20)
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/* =========================================================
   REGISTER
========================================================= */

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  try {
    const parsed = registerSchema.parse(input);
    const email = parsed.email.toLowerCase();

    // Quick pre-check for nicer error message
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { success: false, error: "Email already registered" };
    }

    // better-auth handles: password hashing + accounts table entry + user insert
    const res = await auth.api.signUpEmail({
      body: {
        name: parsed.name,
        email,
        password: parsed.password,
        // extra fields are passed through if your auth config allows them
        phone: parsed.phone || undefined,
      } as any,
      headers: await headers(),
    });

    console.log(res)

    if (!res?.user?.id) {
      return { success: false, error: "Failed to register user" };
    }

    // Optional: store phone separately if better-auth's schema doesn't include it
    if (parsed.phone) {
      await db
        .update(users)
        .set({ phone: parsed.phone })
        .where(eq(users.id, res.user.id));
    }

    return { success: true, userId: res.user.id };
  } catch (error) {
    console.error("registerUser error:", error);

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.body?.message ?? "Registration failed",
      };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Failed to register user" };
  }
}

/* =========================================================
   LOGIN (credentials)
========================================================= */

export async function loginUser(input: { email: string; password: string }) {
  try {
    const parsed = loginSchema.parse(input);

    await auth.api.signInEmail({
      body: {
        email: parsed.email.toLowerCase(),
        password: parsed.password,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("loginUser error:", error);

    if (error instanceof APIError) {
      if (
        error.status === "UNAUTHORIZED" ||
        error.body?.code === "INVALID_EMAIL_OR_PASSWORD"
      ) {
        return { success: false, error: "Invalid email or password" };
      }
      return {
        success: false,
        error: error.body?.message ?? "Something went wrong",
      };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Something went wrong" };
  }
}

/* =========================================================
   OAUTH SIGN IN
========================================================= */

export async function oauthSignIn(provider: "google" | "github") {
  try {
    const res = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL: "/dashboard",
      },
      headers: await headers(),
    });

    return { success: true, url: res?.url ?? null };
  } catch (error) {
    console.error("oauthSignIn error:", error);
    return { success: false, error: "OAuth sign in failed" };
  }
}