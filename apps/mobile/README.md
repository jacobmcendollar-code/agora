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

React Native cannot keep Auth.js HttpOnly cookies, so the app does **not** use the CSRF → credentials cookie-jar flow.

1. `POST /api/mobile/login` with `{ username, password }` (same accounts as the site)
2. Persist `sessionToken` + `cookieName` in SecureStore
3. Send `Cookie: ${cookieName}=${sessionToken}` on API calls (`__Secure-authjs.session-token` in production)
4. `GET /api/auth/session` to restore the user; 401 clears the stored token
5. `POST /api/mobile/logout` then clear SecureStore (JWT cannot be revoked server-side)

Existing `auth()` accepts the JWT when it arrives as the Auth.js session cookie. No Bearer middleware.

## Screens

Bottom tabs (icons only): **Home · Communities · Search · New Post**. Account lives in the logo bar. Notifications use `GET`/`PATCH /api/notifications`. Search uses `GET /api/search/suggest`.

- Home / community feeds: `GET /api/feed?sort=&page=&scope=` (and `community=`).
- Sort chips (Trending / Recent / Top) only on those two surfaces.
- Post detail: `GET /api/posts/[id]` (post + comments). Falls back to the feed card cache if that route is not deployed yet.
- Communities: `GET /api/communities` + `POST /api/subscribe`.
- Submit: `POST /api/posts` (community, title, link / text / image per `postFormat`). Surfaces the 48h duplicate-URL 409.
- Votes: `POST /api/vote` with spear icons.
- Settings: Show NSFW via `POST /api/user/show-nsfw`; TikTok/X “open in native app” is a **local** preference (AsyncStorage). Theme toggle is local only.

YouTube plays in an in-app WebView iframe whose document origin / Referer is `https://www.agor4.com` (avoids Error 153). A Watch on YouTube control always opens the watch URL in the in-app browser. TikTok and X open the in-app browser by default.

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
