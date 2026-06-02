import { auth0 } from '@/lib/auth';

/**
 * Route protection middleware — handles two concerns:
 *
 * 1. Auth routes (/api/auth/login, /api/auth/callback, /api/auth/logout, /api/auth/me)
 *    auth0.middleware() processes these internally and returns the appropriate response
 *    (redirect to Auth0, set session cookie, etc.).
 *
 * 2. Protected routes (everything else)
 *    auth0.middleware() checks for a valid session and redirects unauthenticated
 *    users to /api/auth/login.
 *
 * NOTE: /api/auth/* must NOT be excluded from the matcher — the middleware
 * needs to intercept those requests to handle them.
 */
export default auth0.middleware();

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - /_next/static  — Next.js static assets
     *   - /_next/image   — Next.js image optimization
     *   - /favicon.ico
     *   - Static file extensions
     *
     * /api/auth/* and /login are deliberately INCLUDED so the middleware
     * can handle auth callbacks and protect the dashboard.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
