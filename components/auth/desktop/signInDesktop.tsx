import { Suspense } from "react";
import SignInClient from "../../signincontext";

export default async function SignInDesktop({
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
    <Suspense fallback={null}>
      <SignInClient callbackUrl={callbackUrl} />
    </Suspense>
  );
}
