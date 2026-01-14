import SignInDesktop from "@/components/auth/desktop/signInDesktop";
import SignInMobile from "@/components/auth/signInMobile";
import Responsive from "@/components/shared/responsive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your ISCE account to access all services and products",
  openGraph: {
    title: "Sign In | ISCE Auth",
    description:
      "Sign in to your ISCE account to access all services and products",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const callbackUrl =
    (params.callbackUrl as string) ??
    (params.redirect as string) ??
    (params.redirect_uri as string) ??
    null;

  return (
    <Responsive
      desktop={<SignInDesktop searchParams={Promise.resolve(params)} />}
      mobile={<SignInMobile callbackUrl={callbackUrl} />}
    />
  );
}
