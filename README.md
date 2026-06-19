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
| `npm run verify:launch` | **Full pre-launch checklist** (runs all scripts below) |
| `npm run verify:deploy` | Vercel / production env checklist |
| `npm run verify:production` | Post-deploy smoke checks |
| `npm run verify:billing` | Stripe billing setup |
| `npm run verify:invites` | Team invite email (Resend) |
| `npm run verify:oauth` | Platform OAuth credentials |

## Production launch (manual)

**Code complete for v1 launch.** Remaining work is manual ops and policy — not app code. After deploy, run `npm run verify:launch` (or `npm run verify:production` against your live URL). Production smoke was **19/19** passing as of the latest deploy.

### Manual steps before go-live

These steps are not automated — complete them before inviting real users:

1. **Supabase Auth** — Set Site URL and Redirect URLs to your production domain (`/auth/callback`). Enable leaked-password protection in Authentication → Providers.
2. **Resend** — Verify a custom sending domain; set `INVITE_EMAIL_FROM` to that domain. Run `npm run verify:invites`.
3. **Stripe** — Switch to live keys and configure the production webhook (`/api/billing/webhook`). Run `npm run verify:billing`.
4. **Vercel** — Set all required env vars (`npm run verify:deploy`). After deploy, run `npm run verify:launch` (or `npm run verify:production`) against your live URL.
5. **OAuth** — Register YouTube/Twitch callback URLs shown by the verify scripts when `PLATFORM_OAUTH_ENABLED=true`.
6. **Agency billing policy** — New workspaces get a **5-day platform trial** on their tier’s paid entry plan (Agency, Creator Pro, or Sponsor Pro), then downgrade to the free tier if they don’t subscribe. Existing workspaces before migration 028 are unchanged.

### Launch complete criteria

You are ready to invite real users when:

- [ ] `npm run verify:launch` passes (or `verify:production` is 19/19 on your live URL)
- [ ] Resend domain verified (not `onboarding@resend.dev`)
- [ ] Stripe live mode + webhook receiving events
- [ ] Supabase auth URLs and leaked-password protection configured
- [ ] OAuth callbacks registered in Google/Twitch consoles (if using platform revenue sync)
- [ ] Agency free-tier vs paid policy decided and communicated to the team
- [ ] Platform trials configured (migration 028) — new orgs trialing, existing orgs grandfathered

Settings → **Deploy checklist** mirrors the production health checks in the app UI.

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
