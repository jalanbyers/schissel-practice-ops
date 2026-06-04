import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_USE_MOCK: 'true',
  },
};

export default nextConfig;
