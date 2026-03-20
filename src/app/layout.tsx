import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Bill System - Invoice & Billing Management",
  description: "A comprehensive invoice and billing management system. Track customers, create bills, manage payments, and analyze your business revenue.",
  keywords: ["E-Bill", "Invoice", "Billing", "Management", "Payments", "Business"],
  authors: [{ name: "E-Bill System" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "E-Bill System",
    description: "Invoice & Billing Management System",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
