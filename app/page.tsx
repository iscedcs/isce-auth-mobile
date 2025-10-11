import DesktopHomeBridge from "@/components/shared/desktopHomeBridge";
import Responsive from "@/components/shared/responsive";
import SplashScreenClient from "@/components/shared/splashScreenClient";

export default function Page() {
  return (
    <Responsive
      desktop={<DesktopHomeBridge />}
      mobile={<SplashScreenClient />}
    />
  );
}
