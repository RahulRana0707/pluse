"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/x/providers";
import { parseTweetUrl } from "@/lib/x/parse-tweet-url";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listItems() {
  const userId = await requireUserId();
  return prisma.inspirationItem.findMany({
    where: { userId },
    include: { creator: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Parse a tweet URL/id, validate it loads, then save it to the user's swipe file. */
export async function saveItemFromUrl(rawUrl: string) {
  const userId = await requireUserId();

  const parsed = parseTweetUrl(rawUrl);
  if (!parsed) throw new Error("That doesn't look like a tweet URL.");

  const tweet = await getProvider().getTweet(parsed.tweetId);
  if (!tweet) throw new Error("Couldn't load that tweet — it may be deleted or private.");

  const handle = (parsed.handle ?? tweet.authorHandle).replace(/^@/, "");
  const creator = await prisma.creator.upsert({
    where: { handle },
    update: { name: tweet.authorName ?? undefined },
    create: { handle, name: tweet.authorName },
  });

  return prisma.inspirationItem.upsert({
    where: { userId_tweetId: { userId, tweetId: tweet.id } },
    update: {},
    create: { userId, creatorId: creator.id, tweetId: tweet.id, url: tweet.url },
    include: { creator: true },
  });
}

export async function removeItem(id: string) {
  const userId = await requireUserId();
  await prisma.inspirationItem.deleteMany({ where: { id, userId } });
}

/** Public tweet text for a given id, used to seed an AI remix. */
export async function getTweetText(tweetId: string) {
  await requireUserId();
  const tweet = await getProvider().getTweet(tweetId);
  return tweet?.text ?? null;
}
