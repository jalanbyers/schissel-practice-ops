# Single-stage build — tsx runs TypeScript directly, no compilation step.
# Simpler and more reliable than multi-stage tsc for a monorepo.
FROM node:22-alpine
RUN npm install -g pnpm@9
WORKDIR /app

# Install dependencies (--ignore-scripts avoids native build failures
# for optional deps like cpu-features that require a C compiler)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source
COPY tsconfig.base.json ./
COPY packages/db/src           ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/api/src          ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

# tsx transpiles TypeScript on startup — no dist/ needed
CMD ["node_modules/.bin/tsx", "packages/api/src/index.ts"]
