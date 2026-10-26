import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: fast, cookie-presence based gate for authenticated areas plus security headers.
 *
 * This is only a first line of defence (it cannot hit the database). Real authorization —
 * session validity, roles and tenant membership — is enforced server-side by the guards in
 * `src/lib/auth/guards.ts` on every page and server action.
 */

const SESSION_COOKIE_NAME = "matchlab_session";

const PROTECTED_PREFIXES = ["/dashboard", "/candidate", "/super-admin", "/onboarding", "/account"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  // Note: signed-in users on auth pages are redirected by the pages themselves (after validating
  // the session against the DB) so stale cookies never cause redirect loops.
  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|api/billing/midtrans).*)"],
};
