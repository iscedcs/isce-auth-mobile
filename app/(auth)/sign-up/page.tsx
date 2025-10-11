import SignUpDesktop from "@/components/auth/desktop/signUpDesktop";
import SignUpMobile from "@/components/auth/mobile/signUpMobile";
import Responsive from "@/components/shared/responsive";

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
