"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/x/providers";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export interface GenerationContext {
  profile: {
    about: string;
    pillars: string;
    audience: string;
    tone: string;
    goal: string;
    voiceSamples: string;
  } | null;
  publishedPosts: string[];
  inspiration: string[];
}

const PUBLISHED_SAMPLE = 8;
const INSPIRATION_SAMPLE = 5;

/** Gathers everything the daily generator personalises on: the creator's
 *  profile, a sample of their published posts (voice), and recent swipe-file
 *  tweets (inspiration). */
export async function getGenerationContext(): Promise<GenerationContext> {
  const userId = await requireUserId();

  const [profile, published, items] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId } }),
    prisma.draft.findMany({
      where: { userId, status: { in: ["Published", "published"] } },
      orderBy: { updatedAt: "desc" },
      take: PUBLISHED_SAMPLE,
      select: { body: true },
    }),
    prisma.inspirationItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: INSPIRATION_SAMPLE,
      select: { tweetId: true },
    }),
  ]);

  const provider = getProvider();
  const inspirationTexts = await Promise.all(
    items.map((i) =>
      provider
        .getTweet(i.tweetId)
        .then((t) => t?.text ?? null)
        .catch(() => null),
    ),
  );

  return {
    profile: profile
      ? {
          about: profile.about ?? "",
          pillars: profile.pillars ?? "",
          audience: profile.audience ?? "",
          tone: profile.tone ?? "",
          goal: profile.goal ?? "",
          voiceSamples: profile.voiceSamples ?? "",
        }
      : null,
    publishedPosts: published.map((p) => p.body).filter(Boolean),
    inspiration: inspirationTexts.filter((t): t is string => !!t),
  };
}
