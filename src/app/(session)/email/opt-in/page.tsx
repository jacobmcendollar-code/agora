import type { Metadata } from "next";
import { applyPromotionalEmailToken } from "@/lib/apply-promotional-email-token";
import { EmailPreferenceResult } from "@/components/email-preference-result";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email opt-in",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function EmailOptInPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = await applyPromotionalEmailToken(token, true);

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
      title="You're opted in"
      body="You'll receive occasional product emails from Agora. You can opt out anytime from Settings or with an opt-out link."
    />
  );
}

