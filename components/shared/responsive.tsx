"use client";
import { useEffect, useMemo, useState } from "react";

/**
 * Decide which UI to render:
 * 1) Respect ui=desktop|mobile query (middleware stores cookie).
 * 2) Respect cookie `ui_preference` if present.
 * 3) Fallback to viewport: desktop if min-width: 1024px, else mobile.
 */
export default function Responsive({
  desktop,
  mobile,
}: {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}) {
  const [choice, setChoice] = useState<"desktop" | "mobile" | null>(null);

  useEffect(() => {
    try {
      // 1/2) Read explicit preference cookie, if present
      const pref = document.cookie
        .split("; ")
        .find((c) => c.startsWith("ui_preference="))
        ?.split("=")[1];

      if (pref === "desktop" || pref === "mobile") {
        setChoice(pref);
        return;
      }

      // 3) Fallback to viewport
      const mql = window.matchMedia("(min-width: 1024px)");
      const apply = () => setChoice(mql.matches ? "desktop" : "mobile");
      apply();
      mql.addEventListener?.("change", apply);
      return () => mql.removeEventListener?.("change", apply);
    } catch {
      setChoice("mobile"); // safe default
    }
  }, []);

  if (!choice) return null; // avoid double-render flash
  return <>{choice === "desktop" ? desktop : mobile}</>;
}
