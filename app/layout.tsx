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
          <NextTopLoader color="#ffffff" showSpinner={false} />
          {children}
          <Toaster richColors position="bottom-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
