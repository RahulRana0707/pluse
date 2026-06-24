import "server-only";

import { prisma } from "@/lib/prisma";
import { xConfig } from "@/lib/x/config";

export interface OwnTweet {
  id: string;
  text: string;
  createdAt: string | null;
  metrics: { views: number; likes: number; replies: number; reposts: number; quotes: number };
}

const REFRESH_SKEW_MS = 60_000;

/** Returns a usable access token, transparently refreshing it when expired. */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const cfg = xConfig();
  if (!cfg) return null;

  const conn = await prisma.xConnection.findUnique({ where: { userId } });
  if (!conn) return null;

  const stillValid = conn.expiresAt && conn.expiresAt.getTime() > Date.now() + REFRESH_SKEW_MS;
  if (stillValid || !conn.refreshToken) return conn.accessToken;

  const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
      client_id: cfg.clientId,
    }),
  });
  if (!res.ok) return conn.accessToken; // best effort — let the caller hit a 401 if truly dead

  const token = await res.json();
  await prisma.xConnection.update({
    where: { userId },
    data: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? conn.refreshToken,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 7200) * 1000),
      scope: token.scope ?? conn.scope,
    },
  });
  return token.access_token as string;
}

async function resolveXUserId(userId: string, token: string): Promise<string | null> {
  const conn = await prisma.xConnection.findUnique({ where: { userId }, select: { xUserId: true } });
  if (conn?.xUserId) return conn.xUserId;

  const res = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const id = (await res.json()).data?.id ?? null;
  if (id) await prisma.xConnection.update({ where: { userId }, data: { xUserId: id } });
  return id;
}

/** Fetches the user's own recent original tweets with their real public metrics. */
export async function fetchOwnTweets(userId: string, max = 15): Promise<OwnTweet[]> {
  const token = await getValidAccessToken(userId);
  if (!token) return [];

  const xUserId = await resolveXUserId(userId, token);
  if (!xUserId) return [];

  const url = new URL(`https://api.twitter.com/2/users/${xUserId}/tweets`);
  url.searchParams.set("max_results", String(Math.min(Math.max(max, 5), 100)));
  url.searchParams.set("tweet.fields", "public_metrics,created_at");
  url.searchParams.set("exclude", "retweets,replies");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Couldn't read your tweets from X.");

  const json = await res.json();
  return (json.data ?? []).map(
    (t: {
      id: string;
      text: string;
      created_at?: string;
      public_metrics?: Record<string, number>;
    }): OwnTweet => ({
      id: t.id,
      text: t.text,
      createdAt: t.created_at ?? null,
      metrics: {
        views: t.public_metrics?.impression_count ?? 0,
        likes: t.public_metrics?.like_count ?? 0,
        replies: t.public_metrics?.reply_count ?? 0,
        reposts: t.public_metrics?.retweet_count ?? 0,
        quotes: t.public_metrics?.quote_count ?? 0,
      },
    }),
  );
}
