# ── Stage 1: install all deps ────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/packages/db/node_modules  ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

COPY tsconfig.base.json ./
COPY packages/db/src           ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/api/src          ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/

# Compile db first (api depends on it)
RUN node_modules/.bin/tsc -p packages/db/tsconfig.json
RUN ls -la packages/db/dist/

RUN node_modules/.bin/tsc -p packages/api/tsconfig.json
RUN ls -la packages/api/dist/

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/db/dist  ./packages/db/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

COPY --from=deps /app/node_modules                   ./node_modules
COPY --from=deps /app/packages/db/node_modules       ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules      ./packages/api/node_modules

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node", "packages/api/dist/index.js"]
