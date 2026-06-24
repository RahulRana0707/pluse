# Phase 1 — Foundation: Data Layer & AI Hardening

**Goal:** Turn the scaffold into a real application with a product data model and persisted state, and tidy the AI/persistence seams so every later phase has solid ground. Nothing user-facing changes dramatically; this is the structural backbone.

**Why this first:** Every later feature (inspiration lists, X tokens, drafts, scheduling) needs to *persist*. Right now only auth persists. Build the data layer once, correctly.

**Depends on:** nothing (current state).

---

## What to CHANGE in the current journey

1. **Extract a shared Prisma client.** Today the `PrismaClient` is instantiated only inside `lib/auth.ts`. Feature code needs it too, and Next dev hot-reload will leak connections if each module `new`s its own.
   - Move client creation to a singleton `lib/prisma.ts` (with the existing `PrismaPg` + `pg` Pool adapter) and import it in `lib/auth.ts`.
2. **Content OS persistence.** `app/(protected)/dashboard/content-os/page.tsx` currently holds draft cards in React state only — they vanish on refresh. Re-point it at the new `Draft` model via server actions (full wiring lands in Phase 4; in Phase 1 just make save/load work).
3. **Centralize env access.** Add a tiny `lib/env.ts` that reads and validates required env vars (`DATABASE_URL`, `NVIDIA_API_KEY`, and the X vars coming in Phase 3) so a missing var fails loudly at startup, not mid-request.

## What to ADD

```
lib/prisma.ts            # shared PrismaClient singleton
lib/env.ts               # validated env access (zod)
lib/actions/             # server actions per domain (drafts.ts, creators.ts, ...)
prisma/schema.prisma     # extend with product models (below)
```

### Prisma schema additions

Add these models (names indicative — adjust to taste). Keep the existing better-auth models untouched.

```prisma
model Creator {
  id         String           @id @default(cuid())
  handle     String           @unique          // without @
  name       String?
  avatarUrl  String?
  bio        String?
  isSeeded   Boolean          @default(false)   // shipped vs user-added
  createdAt  DateTime         @default(now())
  items      InspirationItem[]
  @@map("creator")
}

model InspirationItem {           // a saved/tracked tweet in a user's swipe file
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  creatorId String?
  creator   Creator? @relation(fields: [creatorId], references: [id])
  tweetId   String                       // X status id
  url       String
  note      String?
  createdAt DateTime @default(now())
  @@unique([userId, tweetId])
  @@index([userId])
  @@map("inspiration_item")
}

model Draft {                      // Content OS card / pipeline item
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String?
  body        String
  status      String   @default("idea")   // idea | draft | review | scheduled | published
  source      String?                      // e.g. "inspiration:<tweetId>", "ideas", "hooks"
  scheduledAt DateTime?
  publishedAt DateTime?
  tweetId     String?                      // set once posted to X
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, status])
  @@map("draft")
}
```

> X account tokens are **not** a new model — better-auth already stores `accessToken`/`refreshToken`/`scope` on its `account` table. Phase 3 reuses that.

Add the back-relations on `User` (`inspirationItems InspirationItem[]`, `drafts Draft[]`).

## HOW

1. Edit `prisma/schema.prisma`, then:
   ```bash
   pnpm db:migrate    # prisma migrate dev  -> creates a new migration
   pnpm db:generate   # regenerate client into lib/generated/prisma
   ```
2. Create `lib/prisma.ts` singleton (guard against hot-reload):
   ```ts
   import { PrismaClient } from "@/lib/generated/prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";
   import { Pool } from "pg";

   const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });
   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```
   Then refactor `lib/auth.ts` to import `prisma` from here.
3. Write server actions under `lib/actions/` (`"use server"`), each getting the session via `auth.api.getSession({ headers: await headers() })` and scoping queries by `userId`.
4. Validate env with zod in `lib/env.ts`.

## RESOURCES

- Prisma schema reference — https://www.prisma.io/docs/orm/prisma-schema
- Prisma + Next.js client singleton (avoid hot-reload leaks) — https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
- Prisma migrate — https://www.prisma.io/docs/orm/prisma-migrate
- Next.js Server Actions & mutations — https://nextjs.org/docs/app/getting-started/updating-data
- better-auth server session API — https://www.better-auth.com/docs/concepts/session-management
- zod — https://zod.dev

## ACCEPTANCE CHECKPOINT

- `pnpm db:migrate` succeeds; `creator`, `inspiration_item`, `draft` tables exist (verify with `psql -U rahul -d pluse -c "\dt"`).
- A draft created in Content OS survives a page refresh (persisted via `Draft`).
- One shared `prisma` client; `pnpm tsc --noEmit` clean.

## RISKS / NOTES

- Cost: **$0**.
- Keep migrations additive; never edit the existing auth migration.
