import type { Metadata } from "next";
import SplashGate from "@/components/splash-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Represent Your City",
  description: "Choose your city. Shape what happens next.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><SplashGate>{children}</SplashGate></body>
    </html>
  );
}