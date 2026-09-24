import type { Session } from "next-auth";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function SiteShell({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <Providers session={session}>
      <Navbar />
      <main className="container mx-auto max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <Footer />
    </Providers>
  );
}
