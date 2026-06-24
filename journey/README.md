# Pulse — Build Journey

The end-to-end plan to take Pulse from its current scaffold to a **usable X/Twitter creator-growth platform** — replicating the useful parts of [SuperX](https://superx.so/) and [TweetHunter](https://tweethunter.io/) while staying on a **$0 budget for now** (paid X API only later, if the platform proves itself).

Read the phases in order. Each phase is a self-contained doc with: the goal, what to **change** in the current code, what to **add**, **how** to do it, **resource links**, and an **acceptance checkpoint** that defines "done."

| Phase | Title | Outcome |
|------|-------|---------|
| [Phase 1](./phase-1-foundation.md) | Foundation: Data Layer & AI Hardening | Real product data model + persistence; existing modules stop being throwaway |
| [Phase 2](./phase-2-inspiration.md) | Inspiration Page (Free Base) | Add creators (seed + search-ready + paste URL), render tweet cards — $0 |
| [Phase 3](./phase-3-connect-x.md) | Connect with X (OAuth) & Your Journey | Users link X, see their own last 10–15 tweets, can post |
| [Phase 4](./phase-4-content-engine.md) | Content Engine & Workflow | The AI modules become a real Idea → Draft → Schedule → Publish pipeline |
| [Phase 5](./phase-5-growth-and-deploy.md) | Growth Loops, Analytics & Deploy | Live search, analytics, paid-ready provider swap, deployed |

---

## Current state (snapshot — 2026-06-22)

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · better-auth · Prisma 7 (`@prisma/adapter-pg` + `pg`) · PostgreSQL (`pluse` DB, user `rahul`).

**Auth:** `lib/auth.ts` (better-auth, email+password) · `lib/auth-client.ts` · route protection in `proxy.ts` (redirects unauthenticated `/dashboard/*` to `/login`). Auth tables (`user`, `session`, `account`, `verification`) migrated and live.

**AI:** NVIDIA-hosted open models via the OpenAI SDK.
- `lib/ai/models.ts` — strategy: **DeepSeek V4 Pro** (reasoning/analysis) + **Kimi K2.6** (writing/voice). Task → model mapping.
- `app/api/ai/route.ts` — server route.
- `lib/ai-sdk.ts` — client bridge (`PulseAI`) that classifies a prompt into a task and POSTs to `/api/ai`.
- Env: `NVIDIA_API_KEY` in `.env`.

**Dashboard modules** (`app/(protected)/dashboard/`): `page.tsx` (Command Center), `opportunities`, `patterns`, `hooks`, `analyzer`, `intelligence`, `ideas`, `content-os`. Nav defined in `components/app-sidebar.tsx`.

**The gap:** these modules generate AI output but **persist almost nothing**, there is **no X integration**, and there is **no inspiration page**. Phases below close that gap.

---

## Guiding constraints

1. **$0 now, paid later.** Engineer around X's free tier. Reading *arbitrary* creators' timelines is the paid wall — design a provider seam so paying later is a config change, not a rewrite.
2. **Reuse before adding.** The codebase already has better-auth, Prisma, shadcn/ui, the AI strategy layer, and a sidebar nav system. Extend them; don't reinvent.
3. **Organic growth > automation.** Research verdict: the swipe-file/"study viral → remix" loop drives growth; auto-DM/auto-plug is what gets accounts flagged. Prioritize accordingly.

## X API free-tier reality (the load-bearing fact)

> Exact 2026 numbers are **unverified** — confirm in the [X developer portal](https://developer.x.com/en/portal/dashboard) once credentials exist.

| Capability | Free tier | Notes |
|---|---|---|
| OAuth 2.0 login ("Connect with X") | ✅ | better-auth handles the dance |
| Post on user's behalf | ✅ (low cap, ~1.5k/mo historically) | fine for ~10 accounts |
| Read **your own** recent tweets | ⚠️ limited | cache aggressively |
| Read an **arbitrary creator's** timeline | ❌ paid (Basic ~$200/mo) | this is what SuperX/TweetHunter pay for |
| Render a **single** tweet by ID | ✅ free, no key | Vercel `react-tweet` via syndication CDN |
| oEmbed for a feed | ❌ | single tweets only, rate-limited, iframe widget (not custom cards) |

**Consequence:** the Inspiration page is built as a **curated swipe file** (Phase 2) with an optional **pluggable live-search provider** (Phase 5) for real search/auto-timelines via a cheap third-party API or the paid X API.

## Key resources (global)

- Next.js App Router — https://nextjs.org/docs/app
- Prisma ORM — https://www.prisma.io/docs
- better-auth — https://www.better-auth.com/docs
- shadcn/ui — https://ui.shadcn.com
- Vercel `react-tweet` — https://react-tweet.vercel.app/ · https://github.com/vercel/react-tweet
- X API docs — https://docs.x.com/ · pricing/products — https://developer.x.com/en/portal/products
