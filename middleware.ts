import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import { apiAuthPrefix, authRoutes, publicRoutes } from "./routes";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;

  const isApiAuth = pathname.startsWith(apiAuthPrefix); // /api/auth
  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  const prompt = nextUrl.searchParams.get("prompt");
  const hasReturnParam =
    nextUrl.searchParams.has("redirect") ||
    nextUrl.searchParams.has("redirect_uri") ||
    nextUrl.searchParams.has("callbackUrl");

  const forceLogin = prompt === "login";

  if (isApiRoute || isApiAuth) return NextResponse.next();

  if (isPublicRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn && !forceLogin && !hasReturnParam) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const signIn = new URL("/sign-in", nextUrl);
    signIn.searchParams.set("redirect", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/auth/:path*",
  ],
};
