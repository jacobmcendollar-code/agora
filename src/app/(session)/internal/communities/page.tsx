import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { CommunitiesScreen } from "@/components/communities-screen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Communities",
  description: "Browse and join communities on Agora",
  robots: { index: false, follow: false },
};

export default async function InternalCommunitiesPage() {
  const session = await auth();
  return <CommunitiesScreen userId={session?.user?.id ?? null} />;
}
