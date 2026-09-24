import { auth } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";

export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return <SiteShell session={session}>{children}</SiteShell>;
}
