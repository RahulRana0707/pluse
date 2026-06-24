# Phase 3 — Connect with X (OAuth) & Your Journey

**Goal:** Ship the user's #2 feature: a **"Connect with X"** flow. After connecting, the user can see their **own last 10–15 tweets** ("Your Journey" tab from Phase 2) and Pulse can **post on their behalf** (used by Phase 4's scheduler).

**Why:** Connecting unlocks the "your journey" view and is the prerequisite for publishing. It's free on X's tier (login + low-volume posting).

**Depends on:** Phase 1 (data), Phase 2 (Inspiration page + provider seam). **Requires user-supplied X app credentials.**

---

## Prerequisite from the user

An X developer app (https://developer.x.com/en/portal/dashboard) with **OAuth 2.0** enabled:
- **Client ID** + **Client Secret** → into `.env`.
- **Type:** Web App / Confidential client.
- **Callback / Redirect URI** (dev): `http://localhost:3000/api/auth/callback/twitter`
- **Scopes:** `tweet.read`, `tweet.write`, `users.read`, `offline.access` (offline.access = refresh tokens).

## What to CHANGE

1. **`lib/auth.ts`** — add X as a social provider in the better-auth config. better-auth already persists `accessToken`, `refreshToken`, `scope`, `accountId` on its `account` table, so **no new token model is needed**.
   ```ts
   export const auth = betterAuth({
     database: prismaAdapter(prisma, { provider: "postgresql" }),
     emailAndPassword: { enabled: true },
     socialProviders: {
       twitter: {
         clientId: process.env.X_CLIENT_ID!,
         clientSecret: process.env.X_CLIENT_SECRET!,
         scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
       },
     },
   });
   ```
   > If the built-in `twitter` provider's default scopes don't include write, use the **Generic OAuth plugin** to define the X endpoints + scopes explicitly. Both are first-class in better-auth.
2. **`.env`** — add `X_CLIENT_ID`, `X_CLIENT_SECRET`. (`BETTER_AUTH_URL` already set.) Add them to `lib/env.ts` validation.
3. **Settings / account UI** — wire the sidebar "Settings → Account" (currently `#` in `components/app-sidebar.tsx`) to a real page with a **Connect / Disconnect X** button using `authClient.linkSocial({ provider: "twitter" })`.
4. **Inspiration "Your Journey" tab** (Phase 2 placeholder) — populate with the user's own recent tweets.

## What to ADD

```
app/(protected)/dashboard/settings/page.tsx     # Connect with X, connection status
lib/x/x-client.ts                                # authed X API v2 client (uses stored token)
lib/x/providers/x-api-provider.ts               # implements getUserTweets/getMe via token (own account)
lib/actions/x.ts                                 # getMyTweets(), postTweet(body), token refresh
app/api/x/me/tweets/route.ts                    # (optional) cached endpoint for own timeline
```

## HOW

1. **Connection** — use better-auth's account-linking on the client:
   ```ts
   await authClient.linkSocial({ provider: "twitter", scopes: [...] });
   ```
   On callback, better-auth stores the token row in `account`. Read it server-side via the Prisma `account` model, scoped to the session user.
2. **Authed client** — build a thin `x-client.ts` that attaches `Authorization: Bearer <accessToken>` and calls X API v2:
   - Who am I: `GET /2/users/me`
   - Own recent tweets: `GET /2/users/:id/tweets?max_results=15&tweet.fields=public_metrics,created_at`
   - Post: `POST /2/tweets` with `{ text }` (and reply/thread support later).
3. **Token refresh** — when a call returns 401 and `offline.access` was granted, refresh via the OAuth2 token endpoint using the stored `refreshToken`; persist the new tokens back to `account`. (better-auth may handle refresh depending on version — verify; otherwise implement in `x-client.ts`.)
4. **Caching & limits** — free-tier reads are tight. Cache the own-timeline response (e.g. 15–30 min via `unstable_cache` or a `lastFetchedAt` column) and never poll on every render. For ~10 accounts this stays well within free limits.
5. **Your Journey tab** — render the cached own-tweets through the **same `TweetCard`** from Phase 2 (reuse `getTweet` by ID, or render from the metrics payload).

## RESOURCES

- X OAuth 2.0 (Authorization Code + PKCE) — https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/authorization-code
- X API v2 — user's posts timeline — https://docs.x.com/x-api/posts/user-posts-timeline-by-user-id
- X API v2 — create a post — https://docs.x.com/x-api/posts/creation-of-a-post
- X API v2 — users lookup (`/users/me`) — https://docs.x.com/x-api/users/user-lookup-me
- X API access levels / what each tier allows — https://docs.x.com/x-api/getting-started/about-x-api
- better-auth social providers — https://www.better-auth.com/docs/concepts/oauth
- better-auth Twitter/X provider — https://www.better-auth.com/docs/authentication/twitter
- better-auth Generic OAuth plugin (custom scopes/endpoints) — https://www.better-auth.com/docs/plugins/generic-oauth
- better-auth account linking (`linkSocial`) — https://www.better-auth.com/docs/concepts/users-accounts

## ACCEPTANCE CHECKPOINT

- "Connect with X" launches the X consent screen and returns successfully; status shows **Connected** with the @handle.
- `account` row holds the access (and refresh) token for the user.
- "Your Journey" tab shows the user's last ~15 tweets as cards.
- A test `postTweet("hello from Pulse")` posts to the connected account and returns the new tweet ID.
- Disconnect removes the linked account.

## RISKS / NOTES

- Cost: **$0** (free tier). Posting cap is low — fine for ~10 accounts; surface a friendly message on 429 (the `/api/ai` route already models this pattern).
- Confirm current free-tier read allowance in the portal — if reading own tweets is blocked on free, fall back to rendering tweets the user posts *through* Pulse (we know those IDs) and/or pasted URLs.
- Store secrets only in `.env` (gitignored). Never expose `X_CLIENT_SECRET` to the client.
