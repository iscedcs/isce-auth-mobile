export function getSafeRedirect(target: string | null | undefined) {
  if (!target) return null;
  try {
    const appBase = process.env.NEXT_PUBLIC_URL ?? "";

    const allowed = (process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const u = new URL(target, appBase);
    if (
      u.origin === appBase ||
      allowed.includes(u.origin) ||
      target.startsWith("/")
    ) {
      return u.toString();
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}
