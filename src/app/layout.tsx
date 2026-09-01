import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Analytics } from "@vercel/analytics/react";
import {
  OG_DESCRIPTION,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_TITLE,
  SITE_ORIGIN,
  TWITTER_CARD,
  TWITTER_SITE,
} from "@/lib/social-crawler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Agora | Speak Freely",
    template: "Agora | %s",
  },
  description: "Create communities. Speak freely. Minimal AI moderation.",
  openGraph: {
    type: "website",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_ORIGIN,
    images: [
      {
        url: OG_IMAGE_URL,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        type: OG_IMAGE_TYPE,
      },
    ],
  },
  twitter: {
    card: TWITTER_CARD,
    site: TWITTER_SITE,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE_URL],
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