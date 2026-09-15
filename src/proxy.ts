import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, computeAuthToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  const expected = await computeAuthToken();
  if (!expected) {
    // Auth not configured — fail open in dev, but this should always be set in production.
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Icon routes must stay public: iOS fetches apple-icon.png for "Add to Home
  // Screen" without the login cookie, and gating it meant Safari got a redirect
  // to /login instead of an image — which it silently fell back to rendering
  // as a black icon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png).*)"],
};
