import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Single Auth0 client instance shared across the dashboard.
 *
 * Required environment variables (see .env.example):
 *   AUTH0_DOMAIN         — e.g. your-tenant.us.auth0.com
 *   AUTH0_CLIENT_ID      — the Next.js app's Auth0 client ID
 *   AUTH0_CLIENT_SECRET  — the Next.js app's Auth0 client secret
 *   AUTH0_SECRET         — 32+ random bytes (openssl rand -hex 32)
 *   APP_BASE_URL         — this app's public URL (no trailing slash)
 *   AUTH0_AUDIENCE       — the Fastify API's Auth0 audience identifier
 *
 * The Post-Login Action in Auth0 must stamp two custom claims on the
 * ACCESS token (not the ID token) before this dashboard can extract them:
 *   https://schissel.app/tenant_id  — from event.organization.id or app_metadata
 *   https://schissel.app/roles      — from event.authorization.roles
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
});
