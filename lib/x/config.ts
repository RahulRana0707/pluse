/**
 * Connect-with-X configuration gate. The whole journey (OAuth routes, reading
 * your own tweets) only turns on when both credentials are present — otherwise
 * isXConfigured() is false and callers fall back to a placeholder.
 */

import { env } from "@/lib/env";

export function isXConfigured(): boolean {
  return !!env.X_CLIENT_ID?.trim() && !!env.X_CLIENT_SECRET?.trim();
}

export interface XConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizeUrl: string;
  tokenUrl: string;
}

export function xConfig(): XConfig | null {
  if (!isXConfigured()) return null;
  return {
    clientId: env.X_CLIENT_ID!.trim(),
    clientSecret: env.X_CLIENT_SECRET!.trim(),
    redirectUri: `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/api/x/callback`,
    scopes: ["tweet.read", "users.read", "offline.access"],
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
  };
}
