"use client";
import { useEffect } from "react";
import { getSafeRedirect } from "@/lib/safe-redirect";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw =
        sp.get("redirect") ??
        sp.get("callbackUrl") ??
        sp.get("redirect_uri") ??
        null;

      const safe = getSafeRedirect(raw);
      if (safe) sessionStorage.setItem("redirect_hint", safe);
    } catch (e) {
      console.log("Redirect capture skipped");
    }
  }, []);

  return <>{children}</>;
}
