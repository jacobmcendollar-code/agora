import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agora — Free Speech Communities",
  description: "Create communities. Speak freely. Minimal AI moderation.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950`}>
        <Providers>
          <Navbar />
          <main className="container mx-auto max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
        <Analytics />
        <script async src="https://platform.twitter.com/widgets.js"></script>
      </body>
    </html>
  );
}