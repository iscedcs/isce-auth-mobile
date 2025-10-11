import SignUpClient from "@/components/signupcontext";
import { Suspense } from "react";

export default async function SignUpDesktop({
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
      <SignUpClient callbackUrl={callbackUrl} />
    </Suspense>
  );
}
