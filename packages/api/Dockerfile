# ── Stage 1: install all deps ────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN npm install -g pnpm@9
WORKDIR /app

# Copy only the manifests first — maximises layer cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN npm install -g pnpm@9
WORKDIR /app

COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/packages/db/node_modules  ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

COPY tsconfig.base.json ./
COPY packages/db/src         ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/api/src        ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/

RUN pnpm --filter @schissel/db  exec tsc
RUN pnpm --filter @schissel/api exec tsc

# ── Stage 3: minimal runtime image ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy compiled output and production deps only
COPY --from=builder /app/packages/db/dist  ./packages/db/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

COPY --from=deps /app/node_modules                    ./node_modules
COPY --from=deps /app/packages/db/node_modules        ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules       ./packages/api/node_modules

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node", "packages/api/dist/index.js"]
