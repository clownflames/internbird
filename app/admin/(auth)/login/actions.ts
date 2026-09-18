"use server";

import { cookies } from "next/headers";
import { ADMININFO } from "@/lib/admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-me";

export async function loginAdmin(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  // Username check
  if (username !== ADMININFO.username) {
    return { error: "Invalid username or password" };
  }

  // Password bcrypt verify
  const isPasswordValid = await bcrypt.compare(
    password,
    ADMININFO.password
  );

  if (!isPasswordValid) {
    return { error: "Invalid username or password" };
  }

  // JWT token create
  const token = jwt.sign(
    {
      username: ADMININFO.username,
      role: "admin",
      image: ADMININFO.image,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Cookie set
  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}