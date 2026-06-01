import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    // testcontainers can take 60s+ on first pull
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // run integration tests serially — one container per suite
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
