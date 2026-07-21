# Agora

A free-speech oriented community platform (Reddit-style) with **minimal AI moderation**.

Users create topic-based communities, post, comment, and vote. An LLM only blocks clear spam, pure off-topic content, and illegal material. Everything else is allowed.

## Features (MVP)

- Pseudonymous accounts (username is public identity; email is private)
- Create communities with description + optional AI guidance
- Text + link posts
- Nested comments (one level deep in UI for now)
- Upvote / downvote with Reddit-style hot ranking
- AI moderation on every post and comment (spam + on-topic + illegal only)
- Clean, fast UI

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL
- Auth.js (Credentials provider)
- OpenAI GPT-4o-mini for moderation
- Tailwind CSS

## Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key (optional for local dev — moderation fails open)

### 2. Install

```bash
cd agora
npm install
```

### 3. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-here"   # run: openssl rand -base64 32
AUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."          # optional in dev
```

### 4. Database

```bash
npx prisma db push
# or for migrations later:
# npx prisma migrate dev --name init
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## Design Notes

### Anonymity / Pseudonymity
- Users choose a unique **username** — this is the only public identity.
- Email is required for account recovery but never displayed.
- Easy to create throwaway accounts.

### AI Moderation Philosophy
The prompt is deliberately constrained. It rejects only:
1. Clear spam / advertising
2. Completely off-topic relative to the community description
3. Illegal content (CSAM, credible threats, etc.)

It explicitly does **not** reject offensive opinions, politics, controversy, or "hate speech". When in doubt it allows.

### Ranking
Uses the classic Reddit hot algorithm (time-decayed score). Top and New sorts are trivial to add.

### Scaling Path (for "bigger")
- Move hot score into a generated column or background job
- Add Redis for feed caching + rate limiting
- Queue moderation calls (BullMQ / Inngest) so post creation stays fast
- Add image uploads (S3 / R2) later
- Consider Cloudflare or similar for DDoS / bot protection

## Project Structure

```
src/
  app/                  # routes
  components/           # UI
  lib/
    auth.ts             # Auth.js config
    moderation.ts       # AI gatekeeper
    ranking.ts          # hot score etc.
    prisma.ts
prisma/schema.prisma
```

## Next Steps You Might Want

- Proper nested comment threading UI
- User profile pages + post history
- Community moderators (human) as optional layer on top of AI
- Rate limiting & anti-abuse
- Dark mode toggle
- Search

---

Built to prioritize free speech and usability over heavy content control.
