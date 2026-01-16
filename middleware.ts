import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName, getSessionValue } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect dashboard and API routes (except auth)
  const protectedPaths = ["/dashboard", "/api/qr"];
  const isProtected = protectedPaths.some(
    (path) => pathname.startsWith(path) || pathname === path
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get(getSessionCookieName());
    const isAuthenticated = sessionCookie?.value === getSessionValue();

    if (!isAuthenticated) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // For dashboard, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/qr/:path*"],
};
