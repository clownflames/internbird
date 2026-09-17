"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

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

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { success: false, error: "Email already registered" };
    }

    const hashed = await bcrypt.hash(parsed.password, 10);

    const [created] = await db
      .insert(users)
      .values({
        name: parsed.name,
        email,
        phone: parsed.phone || null,
        password: hashed,
      })
      .returning();

    return { success: true, userId: created.id };
  } catch (error) {
    console.error("registerUser error:", error);
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

    await signIn("credentials", {
      email: parsed.email.toLowerCase(),
      password: parsed.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Something went wrong" };
      }
    }
    // NextAuth v5 throws a special error for redirects — rethrow
    throw error;
  }
}

/* =========================================================
   OAUTH SIGN IN
========================================================= */
export async function oauthSignIn(provider: "google" | "github") {
  await signIn(provider, { redirectTo: "/dashboard" }); // <- yeh change
}