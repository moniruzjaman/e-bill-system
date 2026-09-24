import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { RegisterSW } from "@/components/pwa/register-sw";

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
    "Bangladesh fertilizer policy briefing suite — read the Burden-to-Bloom reports — plus a full invoice & billing management demo. Track customers, create bills, and follow payments.",
  keywords: ["E-Bill", "Invoice", "Billing", "Fertilizer", "Bangladesh", "Reports"],
  authors: [{ name: "E-Bill System" }],
  manifest: "/manifest.webmanifest",
  applicationName: "E-Bill Reports",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "E-Bill System — Fertilizer Policy Reports",
    description:
      "Bangladesh fertilizer policy briefing suite plus an invoice & billing management demo.",
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
    title: "E-Bill System — Fertilizer Policy Reports",
    description:
      "Bangladesh fertilizer policy briefing suite plus an invoice & billing management demo.",
    images: ["/social-preview.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#006A4E",
  width: "device-width",
  initialScale: 1,
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
        <RegisterSW />
      </body>
    </html>
  );
}
