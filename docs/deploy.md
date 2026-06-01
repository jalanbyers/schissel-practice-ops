# Deploy Runbook

## Architecture

```
Browser → Vercel (Next.js dashboard)
                ↓ authenticated API calls
          Fly.io (Fastify API)
                ↓ tenant-scoped queries
           Neon (PostgreSQL)

Auth: Auth0 (JWT, RS256, RBAC, MFA)
```

## Prerequisites

- `pnpm` ≥ 9, Node 22
- Docker (local dev only)
- Accounts: Vercel, Fly.io, Neon (or any managed Postgres), Auth0

---

## 1. Database — Neon (or any Postgres ≥ 15)

```bash
# Create a Neon project at neon.tech, get the connection string, then:
psql $DATABASE_URL -f packages/db/migrations/0000_initial.sql
```

Alternatively with drizzle-kit after setting `DATABASE_URL`:
```bash
pnpm --filter @schissel/db migrate
```

---

## 2. Auth0

1. Create a new **API** in Auth0 dashboard.
   - Identifier (audience): `https://api.schissel.app`
   - Signing: RS256

2. Create a **Post-Login Action** that stamps custom claims on every access token:

```js
// Auth0 Actions → Triggers → post-login
exports.onExecutePostLogin = async (event, api) => {
  // tenant_id from the Auth0 organization or a custom user metadata field
  const tenantId = event.organization?.id ?? event.user.app_metadata?.tenant_id;
  api.accessToken.setCustomClaim('https://schissel.app/tenant_id', tenantId);
  api.accessToken.setCustomClaim('https://schissel.app/roles',
    event.authorization?.roles ?? []);
};
```

3. Enable **MFA** for the API audience (Organizations → Policies or Security → MFA).

4. Note: `AUTH0_DOMAIN` = `your-tenant.us.auth0.com`, `AUTH0_AUDIENCE` = `https://api.schissel.app`.

---

## 3. API — Fly.io

```bash
# One-time setup
fly auth login
fly apps create schissel-api

# Set secrets (never committed to git)
fly secrets set \
  AUTH0_DOMAIN=your-tenant.us.auth0.com \
  AUTH0_AUDIENCE=https://api.schissel.app \
  DATABASE_URL=postgres://...

# Deploy
fly deploy --config fly.toml
```

Health check: `GET /healthz` → `{ "ok": true }`

The API enforces tenant isolation on every request:
- JWT validated against Auth0 JWKS (RS256)
- `tenant_id` extracted from custom claim → `request.tenantId`
- Every Drizzle query receives `tenantId` as its first argument
- Cross-tenant access returns `NotFoundError` (identical to missing record — no oracle)

---

## 4. Dashboard — Vercel

```bash
# One-time: link to Vercel
cd apps/dashboard
vercel link

# Set environment variables in Vercel dashboard or CLI:
vercel env add NEXT_PUBLIC_API_URL production   # e.g. https://schissel-api.fly.dev
```

Vercel auto-detects Next.js. The `vercel.json` in `apps/dashboard` points the monorepo
build commands correctly. Set root directory to `apps/dashboard` in Vercel project settings.

**PHI boundary**: TanStack Query has no `persister` configured. No sensitive data is
written to `localStorage`, `sessionStorage`, or `IndexedDB`. All data paths go through
the API, which scopes every query to `tenant_id`.

---

## 5. Local development

```bash
cp .env.example .env          # fill in AUTH0_DOMAIN, AUTH0_AUDIENCE

# Start Postgres
docker compose up -d postgres

# Run DB migration
pnpm --filter @schissel/db migrate

# Start API (hot-reload via tsx)
pnpm --filter @schissel/api dev

# Start dashboard (separate terminal)
pnpm --filter @schissel/dashboard dev
```

Or run the full stack via Docker Compose:
```bash
docker compose up
```
Then open the dashboard at `http://localhost:3000` separately (it's not in Compose —
Next.js dev server is faster without Docker overhead).

---

## 6. CI

GitHub Actions runs on every push to `main` and every PR:

| Job | What it does |
|---|---|
| `typecheck` | `tsc --noEmit` on db, api, and dashboard |
| `test-db` | Cross-tenant denial tests via testcontainers (real Postgres) |
| `test-api` | Auth + RBAC tests (in-process RS256 key pair, no network) |

The tenant isolation tests (`packages/db/src/__tests__/tenant-isolation.test.ts`)
are the executable spec for the PHI boundary rule. They run on every PR and must
stay green — do not skip or weaken them without team sign-off.

---

## 7. Post-deploy checklist

- [ ] `GET /healthz` returns `{ ok: true }` on Fly.io URL
- [ ] Auth0 login flow works end-to-end (token has `tenant_id` claim)
- [ ] MFA enforced on `/v1/licenses` POST (returns 403 without `amr: mfa`)
- [ ] Cross-tenant test: two test accounts cannot see each other's records
- [ ] Dashboard loads at Vercel URL, Overview renders
- [ ] CI is green on `main`

---

## Environment variables reference

| Variable | Where set | Description |
|---|---|---|
| `DATABASE_URL` | Fly.io secret, local `.env` | Postgres connection string |
| `AUTH0_DOMAIN` | Fly.io secret, local `.env` | e.g. `your-tenant.us.auth0.com` |
| `AUTH0_AUDIENCE` | Fly.io secret, local `.env` | e.g. `https://api.schissel.app` |
| `PORT` | Fly.io env (fly.toml) | Defaults to 3001 |
| `NEXT_PUBLIC_API_URL` | Vercel env | Full URL of the Fly.io API |
