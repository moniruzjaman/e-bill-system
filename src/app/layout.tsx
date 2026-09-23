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

export const metadata: Metadata = {
  title: "E-Bill System — Invoice & Policy Briefing",
  description:
    "Invoice and billing management plus Bangladesh fertilizer policy reports. Track customers, create bills, and read the Burden-to-Bloom briefing suite.",
  keywords: ["E-Bill", "Invoice", "Billing", "Fertilizer", "Bangladesh", "Reports"],
  authors: [{ name: "E-Bill System" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "E-Bill System",
    description: "Invoice management and fertilizer policy briefing suite",
    type: "website",
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
