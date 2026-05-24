import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N-tropy Call · Martinez Soluzioni",
  description: "Sistema multi-agente di chiamate automatiche N-tropy Call",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="it" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <head>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          />
        </head>
        <body className="min-h-full flex flex-col bg-surface text-on-surface font-sans">
          <LanguageProvider>
            <Nav />
            <main className="flex-1">{children}</main>
          </LanguageProvider>
        </body>
      </html>
  );
}
