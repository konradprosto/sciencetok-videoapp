import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "VideoApp",
  description: "Platforma wideo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050506] text-[#EDEDEF]">
        <AuthProvider>
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
