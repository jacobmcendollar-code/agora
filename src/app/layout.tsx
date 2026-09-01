import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.agor4.com"),
  title: {
    default: "Agora | Speak Freely",
    template: "Agora | %s",
  },
  description: "Create communities. Speak freely. Minimal AI moderation.",
  openGraph: {
    title: "Agora | Speak Freely",
    description: "Topic communities with minimal interference",
    url: "https://www.agor4.com",
    images: [
      {
        url: "https://www.agor4.com/agora-og-card.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agora | Speak Freely",
    description: "Topic communities with minimal interference",
    images: ["https://www.agor4.com/agora-og-card.png"],
  },
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