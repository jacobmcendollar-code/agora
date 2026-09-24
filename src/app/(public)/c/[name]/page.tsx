import { CommunityScreen } from "@/components/community-screen";

export const dynamic = "force-static";
export const revalidate = 60;

type Props = {
  params: Promise<{ name: string }>;
};

export default async function CommunityPage({ params }: Props) {
  const { name } = await params;
  return <CommunityScreen name={name} session={null} />;
}
