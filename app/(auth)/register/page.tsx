import QuickRegisterForm from "@/components/auth/regsiter-form";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Register",
  description: "Quick registration for ISCE account access",
  openGraph: {
    title: "Quick Register | ISCE Auth",
    description: "Quick registration for ISCE account access",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuickRegisterPage() {
  return (
    <Suspense fallback={<></>}>
      <QuickRegisterForm />
    </Suspense>
  );
}
