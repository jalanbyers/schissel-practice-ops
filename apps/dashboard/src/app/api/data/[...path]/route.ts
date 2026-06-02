/**
 * Authenticated BFF proxy — forwards all /api/data/* requests to the Fastify
 * API with a fresh Auth0 access token attached as Bearer.
 *
 * Client components call /api/data/licenses, /api/data/payers/:id, etc.
 * The token is retrieved server-side so it is never exposed to the browser.
 *
 * Internal API URL:
 *   API_INTERNAL_URL — set in production (e.g. Fly.io private network address).
 *   Falls back to localhost:3001 in dev.
 */

import { auth0 } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env['API_INTERNAL_URL'] ?? 'http://localhost:3001';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, method: string, ctx: Ctx) {
  const { path } = await ctx.params;
  const { token } = await auth0.getAccessToken();

  const apiPath = path.join('/');
  const search   = request.nextUrl.search;
  const url      = `${API_BASE}/v1/${apiPath}${search}`;

  const isBodyMethod = method === 'POST' || method === 'PATCH' || method === 'PUT';
  const body = isBodyMethod ? await request.text() : undefined;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  // Preserve status; parse JSON or return empty on 204
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({ error: 'Upstream error' }));
  return NextResponse.json(data, { status: res.status });
}

export const GET    = (req: NextRequest, ctx: Ctx) => proxy(req, 'GET',    ctx);
export const POST   = (req: NextRequest, ctx: Ctx) => proxy(req, 'POST',   ctx);
export const PATCH  = (req: NextRequest, ctx: Ctx) => proxy(req, 'PATCH',  ctx);
export const DELETE = (req: NextRequest, ctx: Ctx) => proxy(req, 'DELETE', ctx);
