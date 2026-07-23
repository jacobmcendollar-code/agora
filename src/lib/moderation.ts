import OpenAI from "openai";

export type ModerationResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Minimal free-speech oriented moderation using Grok (xAI).
 * Rejects only clear spam, pure off-topic, and clearly illegal content.
 */
export async function moderateContent(params: {
  type: "post" | "comment";
  title?: string;
  body: string;
  communityName: string;
  communityDescription: string;
  communityRules?: string | null;
}): Promise<ModerationResult> {
  const {
    type,
    title,
    body,
    communityName,
    communityDescription,
    communityRules,
  } = params;

  if (!body || body.trim().length < 1) {
    return { allowed: false, reason: "Empty content" };
  }

  if (body.length > 40_000) {
    return { allowed: false, reason: "Content too long" };
  }

  if (!process.env.XAI_API_KEY) {
    console.warn("[moderation] No XAI_API_KEY — allowing content in dev mode");
    return { allowed: true };
  }

  const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });

  const systemPrompt = `You are a light-touch content moderator for a free-speech discussion platform called Agora.

Community: "${communityName}"
Description: ${communityDescription}
${communityRules ? `Additional community guidance for the AI: ${communityRules}` : ""}

Your job is deliberately minimal. You exist only to stop spam, pure off-topic noise, and clearly illegal harmful content. You are NOT a morality, politics, or etiquette police.

STRICT RULES — Reject ONLY if the content clearly matches one of these:

1. Spam / advertising / promotional content / bot-like repetitive posting
2. Completely unrelated to the community topic (e.g. crypto spam in a gardening community)
3. Clearly illegal or directly harmful content, limited to:
   - Child sexual abuse material or sexual content involving minors
   - Credible threats of real-world violence against specific people
   - Direct attempts to solicit or carry out serious crimes
   - Fraud / scams intended to steal money, accounts, or personal data

Do NOT reject for:
- Offensive, rude, or "hateful" opinions
- Political views of any kind
- Controversy, edginess, dark humor, or strong language
- Criticism of any group, ideology, or person
- News, opinion, fiction, or general discussion of illegal topics
- Hypothetical discussion that does not instruct or solicit real harm
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
    const response = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: ModerationResult;

    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned) as ModerationResult;
    } catch {
      console.warn("[moderation] Could not parse Grok response, allowing:", raw);
      return { allowed: true };
    }

    if (typeof parsed.allowed !== "boolean") {
      return { allowed: true };
    }

    return parsed;
  } catch (err) {
    console.error("[moderation] Grok API call failed:", err);
    // Fail open to preserve availability; admins can still remove content.
    return { allowed: true };
  }
}