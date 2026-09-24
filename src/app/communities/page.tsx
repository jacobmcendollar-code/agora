import { CommunitiesScreen } from "@/components/communities-screen";

export const metadata = {
  title: "Communities",
  description: "Browse and join communities on Agora",
};

export const revalidate = 120;

export default function CommunitiesPage() {
  return <CommunitiesScreen userId={null} />;
}
