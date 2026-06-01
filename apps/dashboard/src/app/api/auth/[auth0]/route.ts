import { auth0 } from '@/lib/auth';

/**
 * Auth0 SDK route handler — catches all /api/auth/* paths:
 *   GET /api/auth/login    — initiates Auth0 Universal Login
 *   GET /api/auth/logout   — clears session and redirects
 *   GET /api/auth/callback — exchanges the code for tokens
 *   GET /api/auth/profile  — returns the current user's profile
 */
export const GET = auth0.handleAuth();
