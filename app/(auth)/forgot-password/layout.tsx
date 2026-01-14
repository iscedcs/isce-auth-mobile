import type { Metadata } from "next";

// Dynamic metadata based on pathname would require a client component or middleware
// For now, we'll use a general metadata that applies to all forgot-password routes
export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your ISCE account password securely",
  openGraph: {
    title: "Forgot Password | ISCE Auth",
    description: "Reset your ISCE account password securely",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
