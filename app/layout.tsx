import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";

import { SessionProvider } from "next-auth/react";
import DesktopView from "@/components/shared/desktop-view";

const interTight = Inter_Tight({
  variable: "--inter-tight",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ISCE Auth",
  description: "A centralized authentication service by ISCE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interTight.className} antialiased`}>
        <Toaster richColors />
        <SessionProvider>
          <div className="">
            <div className="hidden lg:inline xl:inline 2xl:inline">
              <DesktopView />
            </div>
            <div className="md:hidden lg:hidden xl:hidden 2xl:hidden">
              <NextTopLoader color="#ffffff" showSpinner={false} />
              {children}
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
