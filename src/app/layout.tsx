import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppDataProvider } from "@/components/AppDataProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PocketWise AI — Small Budget. Big Dreams.",
  description:
    "AI-powered student expense and budget management system. Stop guessing, start saving with intelligent tracking, receipt scanning, predictive analytics, and PocketWise Copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
    >
      <body className="min-h-screen bg-[#071510] text-[#F4F8F5] antialiased selection:bg-[#40E8A1]/30 selection:text-[#F4F8F5]">
        <ToastProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
