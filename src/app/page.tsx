import { HomeScreen } from "@/components/home-screen";

export const metadata = {
  title: {
    absolute: "Agora | Speak Freely",
  },
  description: "Create communities. Speak freely. Minimal AI moderation.",
};

// Anonymous default (trending) feed. Logged-in visitors and other sorts are
// rewritten to the dynamic renderer so this document can stay cached.
export const revalidate = 60;

export default function HomePage() {
  return <HomeScreen session={null} />;
}
