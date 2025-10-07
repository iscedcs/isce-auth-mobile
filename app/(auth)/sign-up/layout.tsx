import AuthHeader from "@/components/shared/authHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth by ISCE",
  description: "Centralized Authentication Service by ISCE",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className=" w-full">
      <AuthHeader
        loading={false}
        message="Hang tight, while we take you through our account setup process, this
        will not take up much of your time."
      />
      <div className=" p-[20px] relative w-full h-screen ">{children}</div>
    </div>
  );
}
