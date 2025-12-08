export function getSafeRedirect(url?: string | null): string | null {
  if (!url) return null;

  try {
    const allowed = process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS!.split(",");

    const u = new URL(url, window.location.origin);

    if (allowed.includes(u.origin)) return u.toString();
    if (url.startsWith("/")) return url;

    return null;
  } catch {
    return null;
  }
}
