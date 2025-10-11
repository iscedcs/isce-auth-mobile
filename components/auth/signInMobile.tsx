import MobileSignInForm from "@/components/forms/auth/mobile/signInMobileForm";

export default function SignInMobile({
  callbackUrl,
}: {
  callbackUrl: string | null;
}) {
  return (
    <div>
      <MobileSignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
