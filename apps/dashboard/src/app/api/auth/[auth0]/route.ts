/**
 * Auth routes are handled by src/middleware.ts via auth0.middleware().
 * This file exists only to satisfy Next.js routing — requests to
 * /api/auth/* are intercepted by the middleware before reaching here.
 *
 * In @auth0/nextjs-auth0 v4, auth0.middleware() processes login, callback,
 * logout, and profile routes directly in the middleware layer.
 */
export async function GET() {
  return new Response('Auth handled by middleware', { status: 200 });
}

export async function POST() {
  return new Response('Auth handled by middleware', { status: 200 });
}
