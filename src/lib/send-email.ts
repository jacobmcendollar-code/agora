import { Resend } from "resend";

/** Verified sender already used by password reset. Inbox for people is hello@. */
export const EMAIL_FROM = "Agora <noreply@agor4.com>";
export const EMAIL_INBOX = "hello@agor4.com";

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY missing");
    return { ok: false as const, error: "missing_key" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: input.to,
    replyTo: EMAIL_INBOX,
    subject: input.subject,
    text: input.text,
  });

  if (result.error) {
    console.error("[email] Resend error:", result.error);
    return { ok: false as const, error: "send_failed" };
  }

  return { ok: true as const, id: result.data?.id };
}
