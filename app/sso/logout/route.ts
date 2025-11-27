import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectParam =
    url.searchParams.get("redirect") ||
    url.searchParams.get("callbackUrl") ||
    url.searchParams.get("redirect_uri") ||
    "/";

  // Build callback
  const authBase = process.env.NEXT_PUBLIC_URL!;
  const callbackUrl = `${authBase}/sign-in?prompt=login&redirect=${encodeURIComponent(
    redirectParam
  )}`;

  const res = NextResponse.redirect(callbackUrl);

  // ❗Delete ALL NextAuth cookies
  res.cookies.set("next-auth.session-token", "", {
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("__Secure-next-auth.session-token", "", {
    path: "/",
    maxAge: 0,
    secure: true,
    httpOnly: true,
  });

  res.cookies.set("next-auth.callback-url", "", {
    path: "/",
    maxAge: 0,
  });

  // Any optional custom cookies
  res.cookies.set("accessToken", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}
