"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export interface ProfileInput {
  about?: string;
  pillars?: string;
  audience?: string;
  tone?: string;
  goal?: string;
  voiceSamples?: string;
}

export async function getProfile() {
  const userId = await requireUserId();
  return prisma.creatorProfile.findUnique({ where: { userId } });
}

export async function saveProfile(input: ProfileInput) {
  const userId = await requireUserId();
  return prisma.creatorProfile.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
