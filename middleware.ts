import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* =========================================================
   ADMIN AUTH
========================================================= */

const ADMIN_COOKIE = "admin_token";
const ADMIN_LOGIN = "/admin/login";
const ADMIN_HOME = "/admin";

/* =========================================================
   MIDDLEWARE
========================================================= */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ---------------- ADMIN ---------------- */

  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;

    // Already logged-in admin trying to access login
    if (pathname === ADMIN_LOGIN && adminToken) {
      return NextResponse.redirect(
        new URL(ADMIN_HOME, request.url)
      );
    }

    // Protect all /admin/* routes except login
    if (pathname !== ADMIN_LOGIN && !adminToken) {
      const loginUrl = new URL(
        ADMIN_LOGIN,
        request.url
      );

      loginUrl.searchParams.set(
        "callbackUrl",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

/* =========================================================
   MATCHER
========================================================= */

export const config = {
  matcher: ["/admin/:path*"],
};