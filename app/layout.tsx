import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

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
        <NextTopLoader color="#ffffff" showSpinner={false} />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
