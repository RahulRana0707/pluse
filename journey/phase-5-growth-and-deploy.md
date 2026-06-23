# Phase 5 — Growth Loops, Analytics, Paid-Ready & Deploy

**Goal:** Cross the line from "works locally" to "a usable product 10 people can sign into." Add the **live-search / auto-timeline** capability behind the provider seam, basic **analytics**, **onboarding**, hardening, and **deployment**.

**Why:** This is where the deferred "search any creator → auto last 15 tweets" lands (the part X doesn't give for free), plus the operational polish that makes Pulse trustworthy.

**Depends on:** Phases 1–4.

---

## What to CHANGE

1. **`lib/x/tweet-provider.ts` consumers** — flip the Inspiration page's "search" and any "load this creator's latest" from placeholder to live, by registering a provider that implements the optional `searchCreators` / `getUserTweets`. The page code does **not** change (that was the point of the seam).
2. **Settings** — add a field for the optional provider API key (or read from env), and a "data source" indicator (free / live-search / official API).
3. **Error handling everywhere** — consistent 429/backoff + user-facing toasts (extend the pattern already in `app/api/ai/route.ts`).

## What to ADD

```
lib/x/providers/rapidapi-provider.ts     # cheap 3rd-party timelines+search (optional key)
lib/x/providers/index.ts                  # provider resolver (free base -> live if key present)
app/(protected)/dashboard/analytics/page.tsx
app/(protected)/onboarding/page.tsx       # first-run: connect X, pick niche, seed creators
lib/rate-limit.ts                         # shared backoff/limit helper
vercel.json  (or railway config)          # cron + deploy config
```

### The live-search provider (the "use any API" path)

Pick ONE data source for auto-timelines; all sit behind `TweetProvider`:

| Option | Cost for ~10 accts | Search + timelines | ToS | When |
|---|---|---|---|---|
| **RapidAPI Twitter endpoint** | free monthly quota → ~$0 | ✅ | gray (scraping) | recommended MVP upgrade |
| **twitterapi.io / socialdata.tools** | ~cents | ✅ | gray | if RapidAPI quota too small |
| **Official X API Basic** | ~$200/mo | ✅ (compliant) | ✅ | when revenue justifies |

Implement whichever as `getUserTweets(handle, limit)` returning `TweetData[]` → the existing `TweetCard` renders them. Resolver logic: if a provider key is configured, use it; else stay on the free render-by-id base.

## HOW

1. **Provider resolver** — `lib/x/providers/index.ts` returns the live provider when its key env var is set, else the free `react-tweet-provider`. One place decides; the app stays oblivious.
2. **Analytics** — for connected accounts, pull `public_metrics` on the user's own posts (Phase 3 token) and chart impressions/likes/follower trend over time; store snapshots in a small `Metric` table so trends survive. Free-tier-friendly (own account only, cached).
3. **Onboarding** — a guided first run: Connect X → choose niche(s) → auto-seed relevant creators into the swipe file → land on Command Center with live recommendations (the existing `/dashboard` insights call).
4. **Deploy** — Railway or Vercel:
   - Set env (`DATABASE_URL`, `NVIDIA_API_KEY`, `X_CLIENT_ID/SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, provider key).
   - Managed Postgres (Railway/Neon/Supabase) — run `prisma migrate deploy`.
   - Update the X app's callback URL to the production domain.
   - Wire `app/api/cron/publish` to Vercel Cron (or Railway scheduler).
5. **Monitoring** — optional Sentry (a Sentry MCP is available in this workspace) for error tracking.

## RESOURCES

- RapidAPI Twitter APIs (collection) — https://rapidapi.com/search/twitter
- twitterapi.io — https://twitterapi.io/ · socialdata.tools — https://socialdata.tools/
- Official X API pricing/tiers — https://developer.x.com/en/portal/products
- X API v2 metrics (`public_metrics`) — https://docs.x.com/x-api/fundamentals/metrics
- Deploy Next.js on Vercel — https://nextjs.org/docs/app/building-your-application/deploying · Railway — https://docs.railway.app/
- Vercel Cron — https://vercel.com/docs/cron-jobs
- Managed Postgres: Neon — https://neon.tech/docs · Supabase — https://supabase.com/docs/guides/database
- Prisma deploy / `migrate deploy` — https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- Sentry for Next.js — https://docs.sentry.io/platforms/javascript/guides/nextjs/

## ACCEPTANCE CHECKPOINT

- With a provider key set, searching a creator returns results and "load latest" shows their recent tweets — **no app code changed**, only the provider.
- Analytics page shows the connected account's metrics trend.
- A new user completes onboarding (connect X → niche → seeded swipe file) end to end.
- App is deployed; 10 accounts can sign up, connect X, build a swipe file, draft, schedule, and publish.

## RISKS / NOTES

- Cost: **$0** on the free base + RapidAPI free quota; only the official X API Basic (~$200/mo) costs real money — adopt it only when revenue justifies (the "paid later" trigger).
- Third-party scraping providers are ToS-gray and can break; keep them behind the seam and degrade to the free render-by-id base if they fail.
- Rotate secrets for production; never reuse the dev X app secret committed anywhere.
