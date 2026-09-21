import { BUSINESS_URL } from "@/lib/const";
import { PRODUCTS } from "@/lib/products";

function toOrigin(url: string): string | null {
  try {
    const origin = new URL(url).origin;
    // Non-http(s) URLs (javascript:, data:) have the opaque origin "null".
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

/**
 * Origins allowed to receive an SSO redirect, compared by exact origin
 * (scheme + host + port) — no prefix, suffix or wildcard matching. That is
 * this app, NEXT_PUBLIC_ALLOWED_APP_ORIGINS, and the apps the dashboard
 * and business sign-in launch directly.
 */
export function getAllowedAppOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_URL,
    ...(process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS ?? "").split(","),
    ...PRODUCTS.map((product) => product.url),
    BUSINESS_URL,
  ]
    .map((value) => (value?.trim() ? toOrigin(value.trim()) : null))
    .filter((origin): origin is string => origin !== null);

  return Array.from(new Set(origins));
}

export function isAllowedAppOrigin(url: URL): boolean {
  return getAllowedAppOrigins().includes(url.origin);
}

export function getSafeRedirect(target: string | null | undefined) {
  if (!target) return null;
  try {
    // Relative paths resolve to this app's own origin. Protocol-relative
    // ("//evil.com") and backslash ("/\evil.com") tricks resolve to another
    // origin and are rejected like any other unknown site.
    // An unset NEXT_PUBLIC_URL must not become the base "", which makes
    // every URL — even absolute ones — throw. Without a known own origin
    // there is nothing to resolve a relative path against, so reject.
    const u = new URL(target, process.env.NEXT_PUBLIC_URL || undefined);
    if (isAllowedAppOrigin(u)) {
      return u.toString();
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}
