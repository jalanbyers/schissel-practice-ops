import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    // Defaults to mock so the Vercel deployment stays pure-mock with no env
    // config, but an explicit NEXT_PUBLIC_USE_MOCK (e.g. in .env.local) now
    // wins. Previously this was hardcoded to 'true', which silently overrode
    // .env.local and made a non-mock (live-API) run impossible to enable.
    NEXT_PUBLIC_USE_MOCK: process.env['NEXT_PUBLIC_USE_MOCK'] ?? 'true',
  },
};

export default nextConfig;
