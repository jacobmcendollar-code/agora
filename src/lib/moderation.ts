import OpenAI from "openai";

export type ModerationResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Minimal free-speech oriented moderation.
 * Rejects only clear spam, pure off-topic, and illegal content.
 */
export async function moderateContent(params: {
  type: "post" | "comment";
  title?: string;
  body: string;
  communityName: string;
  communityDescription: string;
  communityRules?: string | null;
}): Promise<ModerationResult> {
  const { type, title, body, communityName, communityDescription, communityRules } = params;

  // Cheap local checks first
  if (!body || body.trim().length < 1) {
    return { allowed: false, reason: "Empty content" };
  }
  if (body.length > 40_000) {
    return { allowed: false, reason: "Content too long" };
  }

  // If no API key, allow everything (good for local development)
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[moderation] No OPENAI_API_KEY — allowing content in dev mode");
    return { allowed: true };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are a light-touch content moderator for a free-speech discussion platform called Agora.

Community: "${communityName}"
Description: ${communityDescription}
${communityRules ? `Additional community rules for the AI: ${communityRules}` : ""}

Your job is deliberately minimal. You exist only to stop spam and pure off-topic noise so communities remain usable. You are NOT a morality or politics police.

STRICT RULES — Reject ONLY if the content clearly matches one of these:
1. Spam / advertising / promotional content / bot-like repetitive posting
2. Completely unrelated to the community topic (e.g. crypto spam in a gardening community)
3. Illegal content: child sexual abuse material, credible real-world threats of violence, or direct solicitation of crimes

Do NOT reject for:
- Offensive, rude, or "hateful" opinions
- Political views of any kind
- Controversy, edginess, dark humor, or strong language
- Criticism of any group, ideology, or person
- Anything that is merely unpopular or uncomfortable

When in doubt, ALLOW the content. Free speech is the default.

Respond with a single JSON object and nothing else:
{"allowed": true}
or
{"allowed": false, "reason": "brief reason"}`;

  const userContent =
    type === "post"
      ? `New post submission:\nTitle: ${title || "(no title)"}\nBody:\n${body}`
      : `New comment:\n${body}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as ModerationResult;

    if (typeof parsed.allowed !== "boolean") {
      return { allowed: true };
    }

    return parsed;
  } catch (err) {
    console.error("[moderation] AI call failed:", err);
    // Fail open
    return { allowed: true };
  }
}