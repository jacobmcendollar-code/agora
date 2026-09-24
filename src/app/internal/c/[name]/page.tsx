import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { CommunityScreen } from "@/components/community-screen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export default async function InternalCommunityPage({
  params,
  searchParams,
}: Props) {
  const { name } = await params;
  const { sort } = await searchParams;
  const session = await auth();
  return <CommunityScreen name={name} sortParam={sort} session={session} />;
}
