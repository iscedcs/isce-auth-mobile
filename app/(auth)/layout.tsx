"use client";
import { useEffect } from "react";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    if (!session) return;

    const restricted = ["/sign-in", "/sign-up", "/register"];
    if (restricted.includes(pathname)) {
      router.replace("/dashboard");
    }
  }, [session, pathname]);

  return <>{children}</>;
}
