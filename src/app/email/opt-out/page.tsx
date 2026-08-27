import type { Metadata } from "next";
import { applyPromotionalEmailToken } from "@/lib/apply-promotional-email-token";
import { EmailPreferenceResult } from "@/components/email-preference-result";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email opt-out",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function EmailOptOutPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = await applyPromotionalEmailToken(token, false);

  if (result !== "ok") {
    return (
      <EmailPreferenceResult
        ok={false}
        title="This link isn't valid"
        body="It may have expired or already been used incorrectly. You can change this anytime from Settings if you’re logged in."
      />
    );
  }

  return (
    <EmailPreferenceResult
      ok={true}
      title="You're opted out"
      body="You won't receive promotional or product emails. Account emails like password resets are unaffected. You can opt back in from Settings."
    />
  );
}

