import { auth0 } from './auth';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

/**
 * Authenticated fetch for server components and API routes.
 *
 * Gets a fresh access token from the Auth0 session and attaches it as a
 * Bearer token. The Fastify API verifies the token and extracts tenant_id —
 * the dashboard never constructs or forges that claim.
 *
 * Usage:
 *   const res = await apiFetch('/v1/licenses');
 *   const data = await res.json();
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { token } = await auth0.getAccessToken();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
