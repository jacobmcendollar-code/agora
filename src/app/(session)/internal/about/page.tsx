import type { Metadata } from "next";
import AboutPage from "@/app/(public)/about/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "What Agora is and how it works",
  robots: { index: false, follow: false },
};

export default function InternalAboutPage() {
  return <AboutPage />;
}
