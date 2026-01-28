import { NextResponse, NextRequest } from "next/server";
import { publicRoutes, authRoutes } from "./routes";

/*** IMPORTANT:
 * AUTH does NOT protect its own routes.
 * Instead:
 *  It only needs to let SSO handshake flow through without modification.
 */

// Get allowed origins from environment variable
function getAllowedOrigins(): string[] {
  const origins = process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS || "";
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Check if origin is allowed
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

// Create CORS headers for SSO routes
function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {};
  
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization, X-Requested-With";
    headers["Access-Control-Max-Age"] = "86400"; // 24 hours
  }
  
  return headers;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

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

  // 3. Handle SSO routes with CORS
  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/sso")) {
    const response = NextResponse.next();
    
    // Add CORS headers for SSO routes
    const corsHeaders = getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
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
    "camera=(self), microphone=(self), geolocation=(self), interest-cohort=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/auth/:path*",
  ],
};
