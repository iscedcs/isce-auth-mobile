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
  title: {
    default: "ISCE Auth",
    template: "%s | ISCE Auth",
  },
  description: "A centralized authentication service by ISCE",
  keywords: ["ISCE", "authentication", "auth", "login", "sign up", "security"],
  authors: [{ name: "ISCE Digital Concept" }],
  creator: "ISCE Digital Concept",
  publisher: "ISCE Digital Concept",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : undefined,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ISCE Auth",
    title: "ISCE Auth",
    description: "A centralized authentication service by ISCE",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISCE Auth",
    description: "A centralized authentication service by ISCE",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // verification: {

  // },
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
