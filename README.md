# Player One IQ

Gaming agency SaaS for managing creators, sponsors, campaigns, contracts, opportunities, and team collaboration — built with Next.js 15 and Supabase.

**Production:** https://player-one-iq.vercel.app

## Prerequisites

- **Node.js 20+**
- **Supabase** project (database, auth, migrations)
- Optional integrations: **Stripe** (billing), **Resend** (team invite emails), **OAuth** (YouTube, Twitch, Instagram, TikTok platform revenue sync)

## Local setup

1. Copy environment template:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project (Settings → API).

2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000

   **Windows:** run `.\start.ps1` to install deps, clear stale cache, and start the dev server (handles Node PATH issues).

## Verify scripts

Run these before or after deploy to confirm configuration:

| Script | Purpose |
|--------|---------|
| `npm run verify:deploy` | Vercel / production env checklist |
| `npm run verify:production` | Post-deploy smoke checks |
| `npm run verify:billing` | Stripe billing setup |
| `npm run verify:invites` | Team invite email (Resend) |
| `npm run verify:oauth` | Platform OAuth credentials |

## Project structure

```
src/app/          # Next.js App Router pages, API routes, server actions
src/lib/          # Shared utilities (Supabase, permissions, billing, etc.)
supabase/migrations/  # Database schema migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
