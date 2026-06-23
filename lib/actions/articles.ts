"use server";

import type { Prisma } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deriveArticleListTitle,
  normalizeSavedArticleData,
  type SavedArticleData,
} from "@/lib/articles/types";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export async function listArticles() {
  const userId = await requireUserId();
  return prisma.article.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function getArticle(id: string) {
  const userId = await requireUserId();
  const row = await prisma.article.findFirst({ where: { id, userId } });
  if (!row) return null;
  return { id: row.id, data: normalizeSavedArticleData(row.data) };
}

export async function createArticle(data: SavedArticleData): Promise<{ id: string }> {
  const userId = await requireUserId();
  const row = await prisma.article.create({
    data: {
      userId,
      title: deriveArticleListTitle(data),
      data: data as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return { id: row.id };
}

export async function updateArticle(id: string, data: SavedArticleData): Promise<void> {
  const userId = await requireUserId();
  await prisma.article.updateMany({
    where: { id, userId },
    data: {
      title: deriveArticleListTitle(data),
      data: data as unknown as Prisma.InputJsonValue,
    },
  });
}
