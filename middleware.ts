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

  // Create response
  const response = NextResponse.next();

  // Add security headers to all responses
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/auth/:path*",
  ],
};
