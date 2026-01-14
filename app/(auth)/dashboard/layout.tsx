import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Access your ISCE products and services from your dashboard",
  openGraph: {
    title: "Dashboard | ISCE Auth",
    description: "Access your ISCE products and services from your dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
