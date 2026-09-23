import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://e-bill-system.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "E-Bill System — Invoice & Policy Briefing",
  description:
    "Invoice and billing management plus Bangladesh fertilizer policy reports. Track customers, create bills, and read the Burden-to-Bloom briefing suite.",
  keywords: ["E-Bill", "Invoice", "Billing", "Fertilizer", "Bangladesh", "Reports"],
  authors: [{ name: "E-Bill System" }],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "E-Bill System — Invoice & Policy Briefing",
    description:
      "Invoice and billing management plus Bangladesh fertilizer policy reports. Track customers, create bills, and read the Burden-to-Bloom briefing suite.",
    type: "website",
    url: SITE_URL,
    siteName: "E-Bill System",
    locale: "en_US",
    images: [
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "E-Bill System — Invoice & Policy Briefing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Bill System — Invoice & Policy Briefing",
    description:
      "Invoice and billing management plus Bangladesh fertilizer policy reports.",
    images: ["/social-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#006A4E] focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
