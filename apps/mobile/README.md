# Agora iPhone app

Expo / React Native client for [agor4.com](https://www.agor4.com). Same accounts, votes, posts, and communities as the site. Not a PWA.

This folder is self-contained (`package.json`, `node_modules`). The root Next.js / Vercel web build does not compile it.

## Brand

- Wordmark: `assets/agora-logo.png` (637×236), header height 28, width auto (`contain`).
- Dark-first zinc / emerald. Spears for votes (not triangles).
- Tagline: Speak Freely.

## Develop against production

```bash
cd apps/mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL=https://www.agor4.com
npm install
npx expo start
```

Scan the QR code with Expo Go (or press `i` for the iOS simulator on a Mac). The app talks to live `https://www.agor4.com`.

| Script | What it does |
| --- | --- |
| `npx expo start` | Metro bundler + Expo Go |
| `npx expo start --ios` | iOS simulator (macOS) |
| `npx expo start --android` | Android emulator |

## Auth

Server session strategy is Auth.js JWT **cookies**. The app keeps a cookie jar (SecureStore) and calls:

1. `GET /api/auth/csrf`
2. `POST /api/auth/callback/credentials` with `X-Auth-Return-Redirect: 1`
3. `GET /api/auth/session`
4. `POST /api/auth/signout`

No Bearer token endpoint was added. **Do not add one without a CoS / Jacob ping.**

```
TODO(auth): If the cookie jar cannot retain `__Secure-authjs.session-token` /
`__Host-authjs.csrf-token` on device (React Native fetch + Set-Cookie),
votes/submit will 401. Fix is a first-party mobile session endpoint — ask
Jacob / CoS before changing server auth.
```

## Screens

Bottom tabs (no hamburger): **Home · Communities · Submit · Account**.

- Home / community feeds: `GET /api/feed?sort=&page=&scope=` (and `community=`).
- Sort chips (Trending / Recent / Top) only on those two surfaces.
- Post detail: `GET /api/posts/[id]` (post + comments). Falls back to the feed card cache if that route is not deployed yet.
- Communities: `GET /api/communities` + `POST /api/subscribe`.
- Submit: `POST /api/posts` (community, title, link / text / image per `postFormat`). Surfaces the 48h duplicate-URL 409.
- Votes: `POST /api/vote` with spear icons.
- Settings: Show NSFW via `POST /api/user/show-nsfw`; TikTok/X “open in native app” is a **local** preference (AsyncStorage). Theme toggle is local only.

YouTube plays in an in-app WebView embed. TikTok and X open the in-app browser by default.

## EAS / TestFlight (blocked on Apple)

Apple Developer Individual enrollment can take up to 48 hours. You can develop in Expo Go now. You cannot ship a signed install or TestFlight until the account is **Active**.

Once Active:

```bash
cd apps/mobile
npm i -g eas-cli   # or npx eas-cli
npx eas-cli login
npx eas-cli init   # creates the Expo project and writes extra.eas.projectId
```

Bundle identifier: `com.agor4.app`.

| Profile (`eas.json`) | Use |
| --- | --- |
| `development` | Dev client, internal distribution |
| `preview` | Internal / ad-hoc install for Jacob |
| `production` | App Store / TestFlight submit |

```bash
# Internal install (preview) — iPhone
npx eas-cli build --platform ios --profile preview

# After a production build
npx eas-cli submit --platform ios --profile production
```

Blocked on Apple until Active:

- Signing certificates and provisioning profiles
- Device installs of a standalone `.ipa` (Expo Go still works)
- TestFlight and App Store Connect

Do not buy extra paid vendors. EAS is Expo’s free-tier-friendly build service.

## Monorepo / Vercel

Root `package.json` `build` stays `prisma generate && next build`. Root `tsconfig.json` excludes `apps/` so the web TypeScript pass ignores Expo. Install and run mobile only from `apps/mobile`.
