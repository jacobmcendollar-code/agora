import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { HomeScreen } from "@/components/home-screen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Agora | Speak Freely",
  },
  description: "Create communities. Speak freely. Minimal AI moderation.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function InternalHomePage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  return <HomeScreen session={session} sortParam={params.sort} />;
}
