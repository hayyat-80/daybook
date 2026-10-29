This is a Next.js (App Router) website. Prioritize mobile-first patterns, performance, and a clean PWA / Add-to-Home-Screen experience.

## Commands

```bash
npm install
npm run dev          # start Next.js
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # oxlint
npm run format       # oxfmt
```

Use `npx vercel` for deploy. Prefer Next.js built-ins over third-party libraries when possible.
Lint with **oxlint**, format with **oxfmt** (OXC). Do not add ESLint/Prettier.

## Navigation & Routing

- Routes live in `app/` — every `page.tsx` is a screen, `layout.tsx` files wrap sections.
- Keep shared UI in `components/`, domain logic in `services/` / `stores/` / `types/`.

## Data

- Browser persistence: `services/persistence/storage.ts` (localStorage or Turso via domain APIs).
- Server: `app/api/{settings,location,app-state,prayer-logs,timetable}` → `db/repositories/*` → Turso (`db/schema.ts`).
- Env template: `.env.example` (`NEXT_PUBLIC_*` for client, `DATABASE_URL` / `DATABASE_AUTH_TOKEN` / `API_SECRET` for server).

## Rules

- Do not reintroduce Expo / React Native.
- Do not hand-edit native `ios/` / `android/` projects — this is a website only.
