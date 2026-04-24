import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeonAI | AI Image Generation",
  description: "Generate stunning AI images with a Neon Noir aesthetic.",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ServiceWorkerRegistrar />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
