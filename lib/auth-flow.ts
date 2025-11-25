import { getSafeRedirect } from "@/lib/safe-redirect";

export function getRedirect() {
  const stored = sessionStorage.getItem("redirect_hint");
  return getSafeRedirect(stored) || "/";
}

export function stepGuard(
  required: boolean,
  router: any,
  redirect = "/sign-in"
) {
  if (!required) {
    router.push(redirect);
    return false;
  }
  return true;
}
