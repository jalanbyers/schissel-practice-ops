import { auth0 } from '@/lib/auth';

/**
 * Route protection middleware.
 *
 * auth0.middleware() handles three things:
 *   1. Processes the /api/auth/* callbacks (login, logout, callback, profile)
 *   2. Redirects unauthenticated requests to Auth0's universal login
 *   3. Silently refreshes expired access tokens using the refresh token
 *
 * Public routes are excluded via the matcher below.
 */
export default auth0.middleware();

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - /api/auth/*  — Auth0 SDK route handlers
     *   - /login       — public login landing page
     *   - /_next/*     — Next.js internals
     *   - /favicon.ico
     *   - Static files with extensions (.png, .svg, etc.)
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
