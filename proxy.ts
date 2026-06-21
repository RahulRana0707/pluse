import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from auth routes to the dashboard
  const isAuthRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
