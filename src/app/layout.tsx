import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velurian — Atelier Dashboard",
  description: "Executive control plane and inventory registry for Velurian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#0F1012] text-[#F3F4F6]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased min-h-full flex flex-col selection:bg-[#E5E7EB] selection:text-[#0F1012]`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
