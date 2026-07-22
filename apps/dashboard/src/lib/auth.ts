import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Single Auth0 client instance shared across the dashboard.
 *
 * In v4, auth0.middleware() handles all auth routes directly — no separate
 * /api/auth/[auth0] route handler is needed. The routes option maps the
 * SDK's internal paths to /api/auth/* so they match what's configured in
 * the Auth0 dashboard (Callback URL, Logout URL).
 */

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';
const IS_PROD  = process.env['NODE_ENV'] === 'production';

/**
 * Fail loudly on missing configuration instead of passing `undefined` into the
 * SDK.
 *
 * Previously every value here used a `!` non-null assertion, which satisfies
 * TypeScript but is a lie at runtime: a missing variable reached the SDK as
 * `undefined` and surfaced as an opaque 500 from /api/auth/callback with no
 * indication of which variable was absent.
 *
 * APP_BASE_URL was worse — it defaulted to http://localhost:3000, so a
 * deployment missing it would build, boot, serve pages, and only fail at the
 * token-exchange step with a redirect_uri mismatch. Silent misconfiguration
 * that looks like a code bug.
 *
 * Each Vercel deployment needs its own APP_BASE_URL matching its own domain,
 * and that domain registered in Auth0's Allowed Callback URLs.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required but not set. The dashboard cannot handle Auth0 ` +
      `login or callback without it. Set it in the deployment's environment ` +
      `variables (Vercel → Project → Settings → Environment Variables). ` +
      `APP_BASE_URL must be the exact origin of THIS deployment, with no ` +
      `trailing slash — a mismatch causes /api/auth/callback to 500 on token ` +
      `exchange.`,
    );
  }
  return value;
}

/**
 * In production every value is mandatory. Locally, and in mock mode, fall back
 * so the dashboard still runs without a full Auth0 tenant configured.
 */
function config(name: string, devFallback: string): string {
  if (IS_PROD && !USE_MOCK) return required(name);
  return process.env[name] ?? devFallback;
}

export const auth0 = new Auth0Client({
  domain:       config('AUTH0_DOMAIN', 'example.us.auth0.com'),
  clientId:     config('AUTH0_CLIENT_ID', 'dev-client-id'),
  clientSecret: config('AUTH0_CLIENT_SECRET', 'dev-client-secret'),
  appBaseUrl:   config('APP_BASE_URL', 'http://localhost:3000'),
  secret:       config('AUTH0_SECRET', 'dev-secret-at-least-32-characters-long!!'),
  authorizationParameters: {
    audience: process.env['AUTH0_AUDIENCE'],
    scope:    'openid profile email offline_access',
  },
  routes: {
    login:    '/api/auth/login',
    logout:   '/api/auth/logout',
    callback: '/api/auth/callback',
    profile:  '/api/auth/me',
  },
});
