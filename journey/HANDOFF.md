# Pulse — Handoff & Next Steps

_Snapshot: 2026-06-23. Picks up where the `phase-*` docs leave off. This captures what was built across the recent working sessions, plus the edge notes and the roadmap so anyone (you or another agent) can resume cleanly._

---

## What shipped (done)

### 1. Content OS — modal + Kanban polish
- **Drafting Editor dialog width fix** — the base `DialogContent` carried `sm:max-w-md`, which an unprefixed `max-w-4xl` couldn't override; added `sm:max-w-4xl` so the editor uses full width.
- **Lag fix** — removed `animate-pulse` on the title icon; pulsing over the overlay's `backdrop-blur` forced a full-viewport re-blur every frame.
- **Button text wrap** — AI Copilot buttons no longer clip (`whitespace-normal`, `h-auto`).
- **Draggable Kanban** — native HTML5 drag-and-drop between columns (Ideas/Drafting/Review/Published), optimistic move persisted via `updateDraft`.

### 2. Inspiration — custom tweet cards + remix flow
- **`components/inspiration/tweet-card.tsx`** — dropped `react-tweet`'s visual `<Tweet>`; renders our own card with app design tokens. Still uses `react-tweet`'s **data** hook (`useTweet`) so it stays free/no-key. Skeleton + "unavailable" states.
- **Remix journey** (`remix-button.tsx`) — clicking the sparkle now opens a **preview/edit modal** (generate → edit → regenerate → save), then saves to Content OS with a "View" toast link. No more blind hand-off.

### 3. AI speed + quality
- **Analyzer "apply rewrite"** — the `analyze` task already returns full rewrites; Content OS now surfaces them with one-click **Apply** (no extra AI call).
- **Article body streaming** — switched the expand prompt from escaped-JSON to **raw Markdown** and added a **streaming branch** to `POST /api/ai` (`stream: true`); the wizard renders the draft live instead of a frozen spinner.
- The `analyze` schema was trimmed then **restored** (`clarity`/`predictedImpressions`/`predictedEngagement`) because the standalone Tweet Analyzer page renders them.

### 4. Daily Posts + Creator Profile
- **`CreatorProfile`** model (about, pillars, audience, tone, goal, voiceSamples) — `lib/actions/profile.ts`.
- **`/dashboard/daily`** — generates 10 ranked, ready-to-post tweets from profile + published posts + swipe-file inspiration; multi-select → bulk add to Content OS. New `daily` AI task.

### 5. One voice fingerprint everywhere
- **`lib/ai/voice.ts`** — `voicePromptBlock()` / `hasVoice()` / `voiceSampleList()`.
- **`components/profile-provider.tsx`** — loads the profile once for the whole dashboard (`useProfile()`), wired in `dashboard/layout.tsx`.
- Voice context now appended to prompts in **Idea Engine, Hook Intelligence, Tweet Analyzer, Opportunity Feed, and Content OS copilot/analyzer**.
- **Voice seed** — `voiceSamples` textarea in the profile dialog; daily generation builds a corpus of `seed posts ∪ published posts` (cap 10) and **falls back to profile fields when the corpus is thin** (fixes the new-user cold-start).
- **Honest labeling** — virality relabeled "Predicted" across Analyzer / Content OS / Daily / Hooks (these are AI estimates, not measured).

### 6. Feedback-data foundation
- **`PostPerformance`** model — source-agnostic (`manual` | `x_api`), multiple snapshots over time, related to `Draft`.
- **Manual logging UI** — Content OS editor shows an "Actual performance" section for Published cards (views/likes/replies/reposts) via `logPerformance`. `listDrafts` includes the latest snapshot.

### 7. Read-only X (Connect with X) — env-gated, dormant until configured
- **Gate** — `X_CLIENT_ID` / `X_CLIENT_SECRET` are **optional** envs; `lib/x/config.ts` `isXConfigured()`. App boots fine without them; OAuth routes 404; Journey tab shows a placeholder.
- **`XConnection`** model — OAuth token store (separate from better-auth's `account`).
- **OAuth 2.0 + PKCE** — `GET /api/x/connect` (authorize redirect) and `GET /api/x/callback` (token exchange, `/users/me`, upsert).
- **`lib/x/x-client.ts`** — transparent token refresh + `fetchOwnTweets()` with real `public_metrics`. Actions in `lib/actions/x.ts` (`getXStatus`, `getOwnTweets`, `disconnectX`).
- **Your Journey tab** (`components/inspiration/journey-tab.tsx`) — placeholder → Connect → connected view with your real metrics + refresh/disconnect.

---

## To enable Connect with X (when you're free)
1. Create an app at developer.x.com → **OAuth 2.0**, **Web App / Confidential client**.
2. Scopes: `tweet.read users.read offline.access`.
3. Callback URL (exact): `${BETTER_AUTH_URL}/api/x/callback` — local: `http://localhost:3000/api/x/callback`.
4. Add `X_CLIENT_ID` / `X_CLIENT_SECRET` to `.env`, restart. The Journey tab flips to "Connect X" automatically.
5. **Verify free-tier read limits** in the X portal — the load-bearing unknown. If reads are tightly capped, cache `getOwnTweets` results instead of fetching live each visit.

---

## What's next (roadmap)

| Priority | Item | Notes |
|---|---|---|
| High | **Auto-populate `PostPerformance` from X** | Needs a draft↔tweet link. Trivial once a posting flow sets `Draft.tweetId`. Interim: a "link an existing tweet to a draft" action so X metrics flow into the feedback dataset before posting exists. |
| High | **Predicted-vs-actual** | Persist a predicted virality score on the draft when analyzed, so logged `PostPerformance` can be compared against it. The dataset is the point. |
| Medium | **Daily Posts automation (#5)** | On-demand today. True daily cron needs: deploy (Phase 5) + move generation **server-side** (currently client→`/api/ai`) + persisted daily batches + Vercel Cron. Cheap interim: "generate-once-per-day-on-open" (persist batch keyed by date, no scheduler). |
| Medium | **Full Phase 3 (posting/scheduling)** | The write side: `tweet.write` scope, compose UI, scheduler/queue. Bigger lift than the read-only subset already shipped. |
| Low | **Harden `PulseAI` task routing** | It still classifies by keyword-sniffing the prompt; prompts now carry appended voice context. Low collision risk, but an explicit `task` argument would remove the fragility. |

---

## Edge notes / gotchas
- **Open loop:** all virality/engagement numbers are **AI predictions** (now labeled "Predicted"). Real ground truth only arrives via manual `PostPerformance` logging (#3b) or the X read (once enabled).
- **Prisma regen gotcha:** after any `schema.prisma` change, run `npx prisma generate` **and restart `pnpm dev`** — the dev server holds an in-memory client that goes stale and throws `Cannot read properties of undefined (reading 'findUnique'/...)` until restarted.
- **$0 constraint holds:** reading *arbitrary* creators' timelines is still the paid wall; the `lib/x/providers` seam keeps that swap a config change. Single-tweet rendering stays free via the syndication CDN.
- **`.env` is gitignored** — never commit secrets. New optional keys: `X_CLIENT_ID`, `X_CLIENT_SECRET`.
