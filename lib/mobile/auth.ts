import { auth } from "@/auth";
import { headers } from "next/headers";

export async function getMobileSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}



export async function requireMobileAuth() {
  const session = await getMobileSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getOptionalMobileAuth() {
  const session = await getMobileSession();
  return session?.user || null;
}