import SplashScreenClient from "@/components/shared/splashScreenClient";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SplashScreenClient />
    </Suspense>
  );
}
