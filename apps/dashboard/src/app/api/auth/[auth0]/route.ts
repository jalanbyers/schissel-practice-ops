import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth';

/**
 * Auth0 SDK v4 route handler.
 * auth0.handler() routes internally to login / logout / callback / profile
 * based on the URL path segment after /api/auth/.
 */
export async function GET(request: NextRequest) {
  return auth0.handler(request);
}

export async function POST(request: NextRequest) {
  return auth0.handler(request);
}
