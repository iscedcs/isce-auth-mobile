import DesktopHomeBridge from "@/components/shared/desktopHomeBridge";
import Responsive from "@/components/shared/responsive";
import SplashScreenClient from "@/components/shared/splashScreenClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to ISCE Auth - Your secure authentication gateway",
  openGraph: {
    title: "ISCE Auth - Secure Authentication",
    description: "Welcome to ISCE Auth - Your secure authentication gateway",
  },
};

export default function Page() {
  return (
    <Responsive
      desktop={<DesktopHomeBridge />}
      mobile={<SplashScreenClient />}
    />
  );
}
