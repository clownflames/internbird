import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* =========================================================
   ADMIN AUTH (cookie based)
========================================================= */

const ADMIN_COOKIE = "admin_token";
const ADMIN_LOGIN = "/admin/login";
const ADMIN_HOME = "/admin";

/* =========================================================
   USER AUTH (Auth.js session cookies)
========================================================= */

const USER_LOGIN = "/login";
const USER_REGISTER = "/register";
const USER_HOME = "/dashboard";

// NextAuth v5 cookie names — dev (http) aur prod (https) dono handle
const AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasUserSession(request: NextRequest) {
  return AUTH_COOKIES.some((name) => request.cookies.get(name)?.value);
}

/* =========================================================
   MIDDLEWARE
========================================================= */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ---------------- ADMIN ---------------- */
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;

    // logged in admin on /admin/login → go to /admin
    if (pathname === ADMIN_LOGIN && adminToken) {
      return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
    }

    // protect every /admin/* route except /admin/login
    if (pathname !== ADMIN_LOGIN && !adminToken) {
      const loginUrl = new URL(ADMIN_LOGIN, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  /* ---------------- USER DASHBOARD ---------------- */
  if (pathname.startsWith("/dashboard")) {
    const session = hasUserSession(request);

    if (!session) {
      const loginUrl = new URL(USER_LOGIN, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  /* ---------------- USER AUTH PAGES ---------------- */
  if (pathname === USER_LOGIN || pathname === USER_REGISTER) {
    const session = hasUserSession(request);
    if (session) {
      return NextResponse.redirect(new URL(USER_HOME, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

/* =========================================================
   MATCHER
========================================================= */

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};