import type { Metadata } from "next";
import PrivacyPage from "@/app/(public)/privacy/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy · Agora",
  description: "How Agora collects, uses, and protects your information.",
  robots: { index: false, follow: false },
};

export default function InternalPrivacyPage() {
  return <PrivacyPage />;
}
