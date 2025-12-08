import { NextResponse, NextRequest } from "next/server";
import { publicRoutes, authRoutes } from "./routes";

/*** IMPORTANT:
 * AUTH does NOT protect its own routes.
 * Instead:
 *  It only needs to let SSO handshake flow through without modification.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif")
  ) {
    return NextResponse.next();
  }

  // 2. Allow all authentication-related screens
  if (authRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Allow SSO handshake
  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/sso")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/auth/:path*",
  ],
};
