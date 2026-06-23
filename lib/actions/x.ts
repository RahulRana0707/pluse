"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isXConfigured } from "@/lib/x/config";
import { fetchOwnTweets, type OwnTweet } from "@/lib/x/x-client";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export interface XStatus {
  configured: boolean;
  connected: boolean;
  username: string | null;
}

export async function getXStatus(): Promise<XStatus> {
  if (!isXConfigured()) return { configured: false, connected: false, username: null };
  const userId = await requireUserId();
  const conn = await prisma.xConnection.findUnique({
    where: { userId },
    select: { username: true },
  });
  return { configured: true, connected: !!conn, username: conn?.username ?? null };
}

export async function getOwnTweets(): Promise<OwnTweet[]> {
  if (!isXConfigured()) return [];
  const userId = await requireUserId();
  return fetchOwnTweets(userId);
}

export async function disconnectX(): Promise<void> {
  const userId = await requireUserId();
  await prisma.xConnection.deleteMany({ where: { userId } });
}
