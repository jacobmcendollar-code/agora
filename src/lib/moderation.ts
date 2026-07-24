import OpenAI from "openai";

export type ModerationResult = {
  allowed: boolean;
  reason?: string;
};

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
    console.warn("[moderation] No XAI_API_KEY — allowing content");
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

Reject ONLY if the content clearly matches one of these:
1. Spam / advertising / promotional content / bot-like repetitive posting
2. Completely unrelated to the community topic
3. Clearly illegal harmful content:
   - child sexual abuse material or sexual content involving minors
   - credible threats of real-world violence against specific people
   - direct attempts to solicit serious crimes
   - fraud/scams intended to steal money, accounts, or personal data

Do NOT reject offensive opinions, politics, strong language, dark humor, or unpopular views.
When in doubt, ALLOW.

Respond with JSON only:
{"allowed": true}
or
{"allowed": false, "reason": "brief reason"}`;

  const userContent =
    type === "post"
      ? `New post submission:\nTitle: ${title || "(no title)"}\nBody:\n${body}`
      : `New comment:\n${body}`;

  try {
    console.log("[moderation] checking", {
      type,
      communityName,
      title: title || null,
    });

    const response = await client.chat.completions.create({
      model: "grok-3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    console.log("[moderation] raw response:", raw);

    let parsed: ModerationResult;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned) as ModerationResult;
    } catch {
      console.warn("[moderation] parse failed, allowing:", raw);
      return { allowed: true };
    }

    if (typeof parsed.allowed !== "boolean") {
      console.warn("[moderation] invalid shape, allowing:", parsed);
      return { allowed: true };
    }

    console.log("[moderation] decision:", parsed);
    return parsed;
  } catch (err) {
    console.error("[moderation] Grok API call failed:", err);
    return { allowed: true };
  }
}