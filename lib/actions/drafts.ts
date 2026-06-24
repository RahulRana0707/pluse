"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export interface DraftInput {
  title?: string | null;
  body: string;
  niche?: string | null;
  status?: string;
  source?: string | null;
}

export async function listDrafts() {
  const userId = await requireUserId();
  return prisma.draft.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      // Latest measured performance snapshot, used to show predicted vs actual.
      performance: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
  });
}

export interface PerformanceInput {
  views?: number | null;
  likes?: number | null;
  replies?: number | null;
  reposts?: number | null;
}

/** Append a measured-performance snapshot to a draft the user owns. */
export async function logPerformance(draftId: string, input: PerformanceInput) {
  const userId = await requireUserId();
  const draft = await prisma.draft.findFirst({ where: { id: draftId, userId }, select: { id: true } });
  if (!draft) throw new Error("Draft not found");

  return prisma.postPerformance.create({
    data: {
      draftId,
      views: input.views ?? null,
      likes: input.likes ?? null,
      replies: input.replies ?? null,
      reposts: input.reposts ?? null,
      source: "manual",
    },
  });
}

export async function createDraft(input: DraftInput) {
  const userId = await requireUserId();
  return prisma.draft.create({
    data: {
      userId,
      title: input.title ?? null,
      body: input.body,
      niche: input.niche ?? null,
      status: input.status ?? "idea",
      source: input.source ?? null,
    },
    // Match listDrafts' shape so callers can map both with toCard().
    include: { performance: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
}

export async function updateDraft(id: string, input: Partial<DraftInput>) {
  const userId = await requireUserId();
  // updateMany scopes the write by userId so a user can only touch their own rows.
  await prisma.draft.updateMany({
    where: { id, userId },
    data: {
      title: input.title,
      body: input.body,
      niche: input.niche,
      status: input.status,
      source: input.source,
    },
  });
}

export async function deleteDraft(id: string) {
  const userId = await requireUserId();
  await prisma.draft.deleteMany({ where: { id, userId } });
}
