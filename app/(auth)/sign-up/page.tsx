import SignUpDesktop from "@/components/auth/desktop/signUpDesktop";
import SignUpMobile from "@/components/auth/mobile/signUpMobile";
import Responsive from "@/components/shared/responsive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new ISCE account to access all services and products",
  openGraph: {
    title: "Sign Up | ISCE Auth",
    description:
      "Create a new ISCE account to access all services and products",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Responsive
      desktop={<SignUpDesktop searchParams={searchParams} />}
      mobile={<SignUpMobile searchParams={searchParams} />}
    />
  );
}
