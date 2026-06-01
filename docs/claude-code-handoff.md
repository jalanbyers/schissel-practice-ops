# Claude Code Handoff — Schissel Practice Ops

Private telemedicine practice-operations dashboard for Schissel Medicine, PLLC.
**No PHI is stored or processed.** This is a business-operations tool only.

---

## Architecture

```
apps/dashboard          Next.js 15 App Router (Vercel)
packages/api            Fastify 5 + Auth0 JWT + RBAC (Fly.io)
packages/db             Drizzle ORM + PostgreSQL (Neon)
```

### Tenant isolation (the authoritative rule)
Every persisted record carries `tenant_id`. Every Drizzle query helper takes
`tenantId` as its **first required argument**. The application layer is the
authoritative gate — not the DB, not the frontend.

Cross-tenant access returns `NotFoundError` (404), indistinguishable from a
genuine missing record. This prevents oracle attacks (attacker cannot probe
whether an ID exists in another tenant's data).

**Proof:** `packages/db/src/__tests__/tenant-isolation.test.ts` — 14 assertions
across all 6 entity types. These tests are the spec. They must stay green.

### PHI boundary (the authoritative rule)
The frontend never writes sensitive data to `localStorage`, `sessionStorage`,
`IndexedDB`, or any client-side cache. All data paths route through the API.
v1 holds no real PHI, but every path is architected as if PHI will flow through it.

**Proof:** TanStack Query in `apps/dashboard` has no `persister` configured.
`next/font` self-hosts fonts; no data is sent to Google.

---

## Auth flow

```
Auth0 Post-Login Action
  → JWT with custom claims:
      https://schissel.app/tenant_id  (from org or app_metadata)
      https://schissel.app/roles      (from Auth0 RBAC)
  → Fastify onRequest hook (packages/api/src/plugins/auth.ts)
      → verifies RS256 signature via Auth0 JWKS
      → extracts tenant_id → request.tenantId
      → extracts roles → request.userRoles
      → extracts amr   → request.mfaVerified
  → preHandler hooks (packages/api/src/plugins/rbac.ts)
      → requireRole('owner','admin') → 403 on insufficient role
      → requireMfa()                 → 403 if amr excludes 'mfa'
  → Route handler
      → passes request.tenantId to every query helper
```

### Roles
| Role | Can do |
|---|---|
| `owner` | Full CRUD + delete + MFA-gated destructive ops |
| `admin` | Read + write, no delete |
| `viewer` | Read only |

---

## Workspace build order (all complete)

| Step | What was built |
|---|---|
| 1 | DB scaffold: Drizzle schema, migrations, cross-tenant denial tests |
| 2 | Auth: Auth0 JWT plugin, `request.tenantId`, RBAC, MFA gate |
| 3 | Dashboard: design tokens, app shell, KpiStat, StatusPill, Overview |
| 4 | Licensing workspace + tile map + slide-over drawer |
| 5 | Credentialing workspace + payer drawer |
| 6 | Engagements workspace + engagement drawer |
| 7 | Finances: ledger CRUD, bar chart, expense breakdown, tax estimator |
| 8 | Compliance: readiness %, quick-toggle, task drawer |
| 9 | Audit logging wired into all workspaces + Settings page |
| 10 | Deploy: CI, Docker, Fly.io, Vercel, initial DB migration |

---

## Key files

```
packages/db/src/__tests__/tenant-isolation.test.ts   ← the spec; never weaken
packages/api/src/plugins/auth.ts                     ← JWT validation + tenantId
packages/api/src/plugins/rbac.ts                     ← role + MFA gates
packages/db/migrations/0000_initial.sql              ← production schema
docs/deploy.md                                       ← deploy runbook
.github/workflows/ci.yml                             ← CI pipeline
```

---

## Design reference

`docs/design-bundle/` — the Claude Design export with full HTML prototype,
all source JSX files, styles, and the README with design tokens and component
specs. Where the README and CSS disagree, **the CSS wins**.

Primary: clinical blue `#2563a8`. Fonts: IBM Plex Sans + IBM Plex Mono.
Icons: Lucide React. No Tweaks panel in production.

---

## Open tasks / known gaps

- **Sidebar live-sync**: editing the practice name/entity in Settings does not
  yet update the sidebar brand block. Needs a React context or a server action
  wrapping the settings update — wire in the first API integration sprint.

- **TanStack Query wiring**: all 6 workspaces still read from server-seeded mock
  data. Replace each `seedX()` call with `useQuery({ queryKey, queryFn: () => fetch(...) })`
  after the Fastify routes are deployed. `NEXT_PUBLIC_API_URL` is the env var.

- **Auth0 frontend integration**: the dashboard has no login flow yet. Add
  `@auth0/nextjs-auth0` (App Router version) and protect all `(dashboard)` routes
  with the middleware wrapper.

- **Audit log persistence**: `emitAudit()` currently writes to a client-side
  in-memory ring buffer. In production it should POST to `POST /v1/audit` (append
  to the `audit_log` table, tenant-scoped, user_id from JWT sub). The table
  exists in the migration.

- **Settings persistence**: Settings page manages local React state only.
  Wire to `GET /v1/settings` + `PATCH /v1/settings` endpoints.

---

## CLAUDE.md constraints (from repo root)

- Read PLAN.md before starting work (when it exists — not yet written).
- PHI boundary: anything touching contract PDFs, billing records, or a practice
  RAG store **must stay on a local model**. Do not route PHI-touching tasks
  to a cloud agent.
- Use `openclaw config set` for all OpenClaw configuration changes. Do not edit
  `~/.openclaw/openclaw.json` directly.
