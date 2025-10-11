import SsoLogoutClient from "@/components/sso-logout-client";
import { Suspense } from "react";

export default function SsoLogoutPage() {
  return (
    <Suspense fallback={null}>
      <SsoLogoutClient />
    </Suspense>
  );
}
