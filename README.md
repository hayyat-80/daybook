# Daybook

A simple personal daybook for everyday life.

Next.js website — host on Vercel and add to an iPhone Home Screen (Safari → Share → Add to Home Screen).

## Database

Uses **Turso** only. Named tables (`settings`, `location`, `prayer_logs`, `semesters`, `courses`, …) are created automatically on first API/`/api/health` request. See `db/schema.ts`.

### Local development

```bash
cp .env.example .env
# fill DATABASE_URL, DATABASE_AUTH_TOKEN, and matching API secrets
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `NEXT_PUBLIC_USE_REMOTE_DB=1`, the browser talks to same-origin APIs (`/api/settings`, `/api/prayer-logs`, `/api/timetable`, …). Set it to `0` to use `localStorage` only.

Generate API secrets:

```bash
openssl rand -hex 32
```

Use the **same** value for `API_SECRET` and `NEXT_PUBLIC_API_SECRET`.

### Production (Vercel)

Set the same env vars on Vercel, deploy with `npx vercel`, then on iPhone Safari → Share → **Add to Home Screen**.

## Scripts

```bash
npm run dev        # Next.js website
npm run build      # Production build
npm run check      # lint (errors+warnings) + typecheck — also runs on every commit
npm run typecheck
npm run lint
npm run format
```

`npm install` enables a git pre-commit hook that:

1. Scans staged files for secrets (blocks `.env`, tokens, etc.)
2. Runs `npm run check` (lint + typecheck)

Real credentials stay in `.env` (gitignored). Only `.env.example` with placeholders is safe to commit.

## Adding a section

1. Create `app/<section>/`
2. Register in `modules/registry.ts`
3. Add `hub.modules.<id>` strings in `i18n/locales/`
