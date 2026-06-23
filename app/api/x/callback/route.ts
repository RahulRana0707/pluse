import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xConfig } from "@/lib/x/config";

/** OAuth callback: validates state, exchanges the code for tokens, reads the
 *  X identity, and upserts the connection. Always redirects back to Inspiration. */
export async function GET(request: Request) {
  const cfg = xConfig();
  if (!cfg) return NextResponse.json({ error: "X is not configured." }, { status: 404 });

  const base = new URL(cfg.redirectUri).origin;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(new URL("/login", base));

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const jar = await cookies();
  const savedState = jar.get("x_oauth_state")?.value;
  const verifier = jar.get("x_oauth_verifier")?.value;
  jar.delete("x_oauth_state");
  jar.delete("x_oauth_verifier");

  const fail = NextResponse.redirect(new URL("/dashboard/inspiration?x=error", base));
  if (!code || !state || !savedState || state !== savedState || !verifier) return fail;

  try {
    const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: cfg.redirectUri,
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) return fail;
    const token = await tokenRes.json();

    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const me = meRes.ok ? (await meRes.json()).data : null;

    const data = {
      accessToken: token.access_token as string,
      refreshToken: (token.refresh_token as string) ?? null,
      expiresAt: new Date(Date.now() + (token.expires_in ?? 7200) * 1000),
      scope: (token.scope as string) ?? cfg.scopes.join(" "),
      xUserId: me?.id ?? null,
      username: me?.username ?? null,
    };

    await prisma.xConnection.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return NextResponse.redirect(new URL("/dashboard/inspiration?x=connected", base));
  } catch {
    return fail;
  }
}
