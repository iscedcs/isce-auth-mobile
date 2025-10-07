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
      <div className=" p-[20px] relative w-full h-screen ">{children}</div>
    </div>
  );
}
