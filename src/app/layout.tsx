import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ActionX — Download. Convert. Simplify.",
  description:
    "ActionX is a high-performance media engine for downloading video, extracting audio, and converting images — all in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-geist: "Geist", system-ui, sans-serif;
            --font-mono: "JetBrains Mono", monospace;
          }
        `}</style>
      </head>
      <body className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface">
        <Navbar />
        <main className="flex flex-1 flex-col pb-28 pt-16 md:pb-0">
          {children}
          <Footer />
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
