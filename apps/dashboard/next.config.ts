import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SSR-first by design (PHI boundary rule).
  // No client-side persistence layers are configured.
};

export default nextConfig;
