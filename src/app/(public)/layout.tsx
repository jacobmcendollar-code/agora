import { SiteShell } from "@/components/site-shell";

// Anonymous shell. Middleware rewrites cookie sessions and non-default sorts
// to /internal, so this HTML is only served to logged-out visitors and crawlers.
// Passing null skips the client /api/auth/session fetch without reading cookies
// here, which would opt these routes out of ISR.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell session={null}>{children}</SiteShell>;
}
