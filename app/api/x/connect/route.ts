import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { xConfig } from "@/lib/x/config";

/** Kicks off the X OAuth 2.0 + PKCE dance: stashes state/verifier in httpOnly
 *  cookies and redirects to X's authorize screen. 404s when X isn't configured. */
export async function GET() {
  const cfg = xConfig();
  if (!cfg) return NextResponse.json({ error: "X is not configured." }, { status: 404 });

  const base = new URL(cfg.redirectUri).origin;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(new URL("/login", base));

  const state = crypto.randomBytes(16).toString("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("scope", cfg.scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const jar = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  jar.set("x_oauth_state", state, opts);
  jar.set("x_oauth_verifier", verifier, opts);

  return NextResponse.redirect(url);
}
