import { auth0 } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export default function middleware(request: NextRequest) {
  if (USE_MOCK) return NextResponse.next();
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
