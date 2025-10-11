// components/sso-logout-client.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SsoLogoutClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authBase = process.env.NEXT_PUBLIC_URL;

    const redirect =
      searchParams.get("callbackUrl") ||
      searchParams.get("redirect") ||
      searchParams.get("redirect_uri") ||
      "/";

    const callbackUrl = `${authBase}/sign-in?prompt=login&redirect=${encodeURIComponent(
      redirect
    )}`;

    signOut({ redirect: true, callbackUrl });
  }, [searchParams]);

  return null;
}
