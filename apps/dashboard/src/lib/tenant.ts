import { decodeJwt } from 'jose';

// Custom claim namespaces — must match the Auth0 Post-Login Action.
export const TENANT_CLAIM = 'https://schissel.app/tenant_id' as const;
export const ROLES_CLAIM  = 'https://schissel.app/roles' as const;

/**
 * Decode (without verification) the access token and extract tenant_id.
 *
 * Verification is the Fastify API's responsibility — the dashboard only
 * reads the claim to route requests and personalise the UI. A forged token
 * here is harmless: the API rejects it when it makes an authenticated call.
 */
export function extractTenantId(accessToken: string): string {
  try {
    const payload = decodeJwt(accessToken);
    const id = payload[TENANT_CLAIM];
    if (typeof id === 'string' && id) return id;
  } catch {
    // Malformed token — return empty; the API call will fail with 401
  }
  return '';
}

export function extractRoles(accessToken: string): string[] {
  try {
    const payload = decodeJwt(accessToken);
    const roles = payload[ROLES_CLAIM];
    if (Array.isArray(roles)) return roles as string[];
  } catch {
    //
  }
  return [];
}
