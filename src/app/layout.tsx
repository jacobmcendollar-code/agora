import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Agora | Free Speech Communities",
    template: "Agora | %s",
  },
  description: "Create communities. Speak freely. Minimal AI moderation.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
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
        className={`${inter.className} flex min-h-screen flex-col bg-[#f7f6f3] dark:bg-[#0c0c0e]`}
      >
        <Providers>
          <Navbar />
          <main className="container mx-auto max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
        <Analytics />
        <script
          async
          src="https://platform.twitter.com/widgets.js"
          charSet="utf-8"
        />
      </body>
    </html>
  );
}