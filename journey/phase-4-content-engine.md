# Phase 4 — Content Engine & Workflow

**Goal:** Make the existing AI modules *do real work*. Turn the disconnected generators (Ideas, Hooks, Analyzer, Patterns, Opportunities) into a single **Idea → Draft → Review → Scheduled → Published** pipeline centered on **Content OS**, fed by the **Inspiration** swipe file and able to **publish via the connected X account**.

**Why:** Until now the modules produce text that evaporates. This phase makes Pulse a tool you actually run your posting workflow through — the point where it becomes *usable daily*.

**Depends on:** Phase 1 (`Draft` model, actions), Phase 2 (Inspiration), Phase 3 (post to X).

---

## What to CHANGE

1. **Every generator module** (`ideas`, `hooks`, `analyzer`, `patterns`, `opportunities`, and Content OS copilot) — add a **"Save to Content OS"** action that writes a `Draft` (`status: "idea"` or `"draft"`, `source` tagged). They currently render output and drop it.
2. **`content-os/page.tsx`** — promote it to the real hub:
   - Load `Draft` rows for the user, grouped by `status` (kanban-style columns already implied by the model).
   - The copilot actions (hook/autocomplete/tone/repurpose) already route through the AI layer — persist their results onto the draft.
3. **Inspiration → Draft bridge** — on a tweet card (Phase 2), add **"Remix this"** → opens Content OS composer pre-filled, `source: "inspiration:<tweetId>"`, and runs the **Kimi (writing)** model to rephrase in the user's voice.
4. **AI routing** — reuse `lib/ai/models.ts` as-is: analysis/scoring → **DeepSeek**, rewriting/voice/final drafts → **Kimi**. No new AI infra.

## What to ADD

```
components/content-os/composer.tsx        # draft editor + AI copilot + schedule control
components/content-os/board.tsx           # status columns (idea/draft/review/scheduled/published)
lib/actions/drafts.ts                     # CRUD + status transitions + schedule/publish
lib/scheduler/                            # due-draft publishing (see HOW)
app/api/cron/publish/route.ts             # cron target: post drafts whose scheduledAt <= now
components/inspiration/remix-button.tsx
```

### Draft lifecycle (uses the Phase 1 `Draft` model)

`idea → draft → review → scheduled → published`
- `scheduled` sets `scheduledAt`.
- A scheduler posts due drafts via `lib/actions/x.ts#postTweet` (Phase 3), sets `publishedAt` + `tweetId`, moves to `published`.

## HOW

1. **Server actions** drive all transitions; UI is optimistic. Validate ownership by `userId` every time.
2. **Scheduling** — keep it simple and free:
   - A single endpoint `app/api/cron/publish/route.ts` queries `Draft where status="scheduled" and scheduledAt <= now()`, posts each, updates rows.
   - Trigger it with **Vercel Cron** (when deployed, Phase 5) or, in dev, a manual "Publish now" button / a local cron hitting the route.
   - Respect X's posting cap — process a bounded batch per run and back off on 429.
3. **Repurpose pipeline** — "turn this thread into a single post / LinkedIn version" = a Kimi call with the right system prompt; save as a new linked `Draft`.
4. **Voice consistency** — optionally store a short "voice profile" (user's own top tweets from Phase 3) and inject it into the Kimi system prompt so rewrites sound like them. This is the feature that makes output feel human (the research's #1 differentiator).

## RESOURCES

- Next.js Server Actions (mutations, revalidation) — https://nextjs.org/docs/app/getting-started/updating-data
- Vercel Cron Jobs — https://vercel.com/docs/cron-jobs
- X API v2 — create a post (threads via `reply.in_reply_to_tweet_id`) — https://docs.x.com/x-api/posts/creation-of-a-post
- Pulse AI strategy (already built) — `lib/ai/models.ts`, `app/api/ai/route.ts`
- shadcn (Tabs, Card, Dialog, Select) — https://ui.shadcn.com/docs/components
- `react-tweet` (render the source tweet inside the remix composer) — https://react-tweet.vercel.app/

## ACCEPTANCE CHECKPOINT

- From Ideas/Hooks/etc., "Save to Content OS" creates a visible `Draft`.
- Content OS shows drafts grouped by status; dragging/moving updates `status` and persists.
- "Remix this" on an inspiration tweet opens a pre-filled composer and produces a Kimi rewrite saved as a draft.
- A scheduled draft posts to X at its time (or via "Publish now") and flips to `published` with a real `tweetId`.

## RISKS / NOTES

- Cost: **$0** (uses free posting + existing NVIDIA AI).
- Posting volume cap is the real limit — never bulk-publish; batch + back off.
- Keep automation tasteful: research shows aggressive auto-posting/auto-DM is what gets accounts flagged. No auto-DM in MVP.
