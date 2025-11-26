import QuickRegisterForm from "@/components/auth/regsiter-form";
import { Suspense } from "react";

export default function QuickRegisterPage() {
  return (
    <Suspense fallback={<></>}>
      <QuickRegisterForm />
    </Suspense>
  );
}
