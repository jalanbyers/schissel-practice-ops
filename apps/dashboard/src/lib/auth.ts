import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Single Auth0 client instance shared across the dashboard.
 *
 * In v4, auth0.middleware() handles all auth routes directly — no separate
 * /api/auth/[auth0] route handler is needed. The routes option maps the
 * SDK's internal paths to /api/auth/* so they match what's configured in
 * the Auth0 dashboard (Callback URL, Logout URL).
 */
export const auth0 = new Auth0Client({
  domain:       process.env['AUTH0_DOMAIN']!,
  clientId:     process.env['AUTH0_CLIENT_ID']!,
  clientSecret: process.env['AUTH0_CLIENT_SECRET']!,
  appBaseUrl:   process.env['APP_BASE_URL'] ?? 'http://localhost:3000',
  secret:       process.env['AUTH0_SECRET']!,
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
