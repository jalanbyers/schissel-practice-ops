import { auth0 } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

/**
 * Detect APP_BASE_URL pointing at a different origin than the one actually
 * serving the request.
 *
 * The Auth0 SDK builds `redirect_uri` from APP_BASE_URL. If they disagree, a
 * login started here sends the user to a *different* deployment for the
 * callback — where the state cookie set on this origin is never sent, so state
 * validation fails and /api/auth/callback returns an opaque 500.
 *
 * This is a real failure this repo hit: three Vercel projects deploy this same
 * app, and one had APP_BASE_URL set to another's origin. Starting a login on
 * schissel-dashboard.vercel.app landed on schissel-health-ops.vercel.app and
 * 500'd, with nothing in the error naming the cause.
 *
 * Note this is a *different* check from the one in lib/auth.ts, which catches
 * a MISSING variable. A wrong-but-present value passes that check cleanly —
 * which is exactly what happened.
 *
 * Returns a diagnostic message, or null when the origins agree.
 */
function originMismatch(request: NextRequest): string | null {
  const configured = process.env['APP_BASE_URL']?.replace(/\/+$/, '');
  if (!configured) return null; // absence is handled in lib/auth.ts

  const actual = request.nextUrl.origin;
  if (configured === actual) return null;

  return (
    `Auth origin mismatch: serving from ${actual} but APP_BASE_URL is ` +
    `${configured}. Auth0 callbacks will fail state validation because the ` +
    `state cookie is set on ${actual} and the callback lands on ${configured}. ` +
    `Set APP_BASE_URL to this deployment's own origin, and register ` +
    `${actual}/api/auth/callback in Auth0's Allowed Callback URLs.`
  );
}

export default function middleware(request: NextRequest) {
  const mismatch = originMismatch(request);

  if (mismatch) {
    // Preview deployments legitimately get a unique origin per branch, so a
    // mismatch there is expected and only worth logging. In production it is a
    // misconfiguration that breaks login.
    if (process.env['VERCEL_ENV'] === 'production') {
      console.error(mismatch);
      if (request.nextUrl.pathname.startsWith('/api/auth')) {
        // Fail here with the reason rather than letting the SDK fail later
        // without one. Both origins are public values — they appear in the
        // address bar and in every redirect_uri — so echoing them leaks
        // nothing an attacker could not already observe.
        return new NextResponse(mismatch, {
          status: 500,
          headers: { 'content-type': 'text/plain' },
        });
      }
    } else {
      console.warn(`[auth] ${mismatch}`);
    }
  }

  if (USE_MOCK && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
