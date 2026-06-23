# Phase 2 — Inspiration Page (Free Base)

**Goal:** Ship the user's #1 feature at **$0**: an Inspiration page where you add creators three ways — **(a) pre-seeded top creators, (b) search [provider-ready], (c) paste a tweet URL** — and see their tweets as rich cards. Includes a "Your Journey" tab placeholder that Phase 3 fills with the user's own tweets.

**Why:** This is the swipe-file engine the research identified as the real growth driver, and it's fully buildable without paying X.

**Depends on:** Phase 1 (`Creator`, `InspirationItem`, `prisma`, server actions).

---

## The core constraint (read first)

You **cannot** auto-pull an arbitrary creator's recent timeline on X's free tier. What IS free:
- Rendering a **single tweet by ID** with no API key, via Vercel's **`react-tweet`** (uses the syndication CDN `cdn.syndication.twimg.com/tweet-result`). Renders as a **custom card**, not an iframe.

So Phase 2 models the page as a **curated swipe file**:
- **Seed creators** ship with a handful of hand-picked notable tweet IDs each → instant content on day one.
- **Paste URL** → parse the status ID → render + save.
- **Search by handle** → the UI and `TweetProvider` seam are built now, but live auto-timelines are wired in **Phase 5** (optional cheap provider). Until then, "search" resolves against the seed set / adds the handle as a creator to paste into.

## What to CHANGE

1. **`components/app-sidebar.tsx`** — add a nav item (place it near the top, it's a primary surface):
   ```tsx
   { title: "Inspiration", url: "/dashboard/inspiration", icon: <Sparkles /> },
   ```
   (import `Sparkles` from `lucide-react`).
2. **`next.config.ts`** — allow X avatar/image domains for `next/image` if you render avatars:
   ```ts
   images: { remotePatterns: [{ hostname: "pbs.twimg.com" }, { hostname: "abs.twimg.com" }] }
   ```

## What to ADD

```
app/(protected)/dashboard/inspiration/page.tsx   # the page (tabs: Creators | Your Journey)
components/inspiration/tweet-card.tsx             # wraps react-tweet <Tweet id=.../>
components/inspiration/add-creator-dialog.tsx     # seed picker + search + paste URL
components/inspiration/creator-list.tsx
lib/x/tweet-provider.ts                           # provider INTERFACE (the seam)
lib/x/providers/react-tweet-provider.ts           # free: render-by-id
lib/x/seed-creators.ts                            # curated handles + tweet IDs
lib/actions/creators.ts                           # add/remove creator, save item (Phase 1)
lib/x/parse-tweet-url.ts                          # URL/handle -> {handle, tweetId}
```

### The provider seam (key abstraction)

```ts
// lib/x/tweet-provider.ts
export interface TweetData { id: string; url: string; authorHandle: string; /* ... */ }
export interface TweetProvider {
  // Always available (free, no key):
  getTweet(id: string): Promise<TweetData | null>;
  // Optional — only implemented by paid/3rd-party providers (Phase 5):
  searchCreators?(query: string): Promise<{ handle: string; name?: string }[]>;
  getUserTweets?(handle: string, limit: number): Promise<TweetData[]>;
}
```
Phase 2 ships `react-tweet-provider` (implements `getTweet`). Phase 5 adds a RapidAPI/X-API provider implementing the optional methods. The page calls the interface, never a concrete provider.

### Seed data shape

```ts
// lib/x/seed-creators.ts  — ~25 AI / build-in-public / startup creators
export const SEED_CREATORS = [
  { handle: "levelsio", name: "Pieter Levels", tweetIds: ["...", "..."] },
  // ...
];
```
Run a one-time `lib/actions` seeder (or a `prisma db seed` script) to upsert these into `Creator` with `isSeeded: true`.

## HOW

1. Install the renderer:
   ```bash
   pnpm add react-tweet
   ```
2. **Tweet card** — use the component directly; it fetches via the syndication CDN at render time:
   ```tsx
   import { Tweet } from "react-tweet";
   export const TweetCard = ({ id }: { id: string }) => <Tweet id={id} />;
   ```
   For server components you can prefetch with `getTweet` from `react-tweet/api` and pass `apiUrl`/fallback; for the MVP the client `<Tweet>` is enough.
3. **Paste URL** → `parse-tweet-url.ts` extracts the ID from `https://x.com/<handle>/status/<id>` (and old `twitter.com`). Save via `lib/actions/creators.ts` → `InspirationItem`.
4. **Page layout** — shadcn `Tabs` (Creators / Your Journey), a creator rail (`creator-list.tsx`), and a responsive card grid. "Your Journey" tab shows an empty/connect-prompt until Phase 3.
5. **Caching** — wrap `getTweet` results in Next `unstable_cache`/route cache so the syndication CDN isn't hit repeatedly (it's undocumented and rate-limited).

## RESOURCES

- `react-tweet` docs — https://react-tweet.vercel.app/
- `react-tweet` GitHub (and the fetch implementation that needs no key) — https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts
- Prerendering tweets without the official API (background) — https://www.stefanjudis.com/blog/how-to-prerender-tweets-without-using-the-official-twitter-apis/
- shadcn Tabs / Dialog — https://ui.shadcn.com/docs/components/tabs · https://ui.shadcn.com/docs/components/dialog
- Next.js caching (`unstable_cache`) — https://nextjs.org/docs/app/api-reference/functions/unstable_cache
- lucide icons — https://lucide.dev/icons/

## ACCEPTANCE CHECKPOINT

- Inspiration nav item routes to the page.
- Pick a seed creator → their curated tweet cards render.
- Paste a tweet URL → a card renders and persists across refresh (`InspirationItem` row).
- Remove a creator/item → gone after refresh.
- `TweetProvider` interface exists and the page depends only on it.

## RISKS / NOTES

- Cost: **$0**.
- The syndication CDN is **undocumented and blockable** by X; cache results and fail gracefully (show "couldn't load this tweet" rather than crashing).
- ToS: rendering public tweets via the same mechanism as embeds is low-risk, but it's not an officially supported API — keep it behind the provider seam so it can be swapped.
- "Search any creator → auto last 15 tweets" is intentionally deferred to Phase 5 (needs a data source X doesn't give for free).
