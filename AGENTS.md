# Argus — Agent Guide

## Repo structure

```
argus/
├── app/
│   ├── backend/api/       # @argus/api — Express 5 server (ingest + REST API) — WORKING
│   ├── backend/worker/    # @argus/worker — BullMQ event processor — WORKING (verified e2e)
│   └── frontend/          # React 19 + Vite dashboard — WORKING (auth → issues → billing)
├── packages/              # @argusdev/sdk-{core,node,browser,react} — PUBLISHED to npm (v0.2 adds vitals)
├── docs/                  # DESIGN_BRIEF.md — dashboard design spec
├── infra/                 # Only README — no docker-compose files exist yet
```

READMEs were rewritten 2026-07-03 to match the source. Still: **when in doubt, trust the source code**, especially for auth, route structure, and schema.

## Key architecture (from actual source)

- **Auth**: Passport session-based (serialize/deserialize User). Routes mounted under `/api/` prefix. Register → OTP sent via Redis (600s TTL) → verify OTP → login → session cookie. Google + GitHub OAuth strategies.
- **Prisma**: Client generated to `app/backend/api/src/generated/prisma/`. Uses `@prisma/adapter-pg` (not the default driver). Schema: User → Account (multi-provider), Organization → OrganizationMember, Project → ProjectKey, Issue → Event, Transaction → Span, Subscription, EventQuota.
- **Worker**: BullMQ Worker consuming from `argus-events` queue. Error pipeline: parse envelope → SHA-256 fingerprint → upsert Issue → write Event.
- **Frontend**: full React 19 dashboard (React Query + Axios, RHF+Zod, Tailwind v4). Conventions in `app/frontend/claude.md`, design tokens in `app/frontend/design.md`.

## Commands (run from repo root)

| Command | What |
|---|---|
| `pnpm dev` | Parallel: api + worker + frontend |
| `pnpm dev:api` | `@argus/api` dev server (ts-node-dev) |
| `pnpm dev:worker` | `@argus/worker` dev server |
| `pnpm dev:frontend` | `frontend` Vite dev server |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | `@argus/api` only (tsc --noEmit) — no typecheck for worker/frontend |
| `pnpm db:generate` | Prisma generate |
| `pnpm db:migrate` | Prisma migrate dev |
| `pnpm db:studio` | Prisma Studio |

## Envelope contract (SDK ↔ API ↔ worker)

- **All timestamps are MILLISECONDS since epoch** (`Date.now()`) — `envelope.timestamp` and `breadcrumbs[].timestamp`. Enforced by a min-bound (2020 in ms) in `app/backend/api/src/validators/envelope.validator.ts`, so an accidental seconds value fails validation loudly instead of storing 1970 dates. The worker passes values straight to `new Date(ms)`.
- **DSN format**: `https://<publicKey>@<host>/<projectId>` — the path segment is the project **id** (cuid), matching the ingest route `POST /api/v1/ingest/:projectId/envelope`. Auth via `x-sentry-auth: Sentry sentry_key=<publicKey>` header or `?sentry_key=` query param.
- Envelope shape source of truth: `envelope.validator.ts` (API) mirrored by `app/backend/worker/src/types/index.ts`.

## Gotchas

- **Prisma client import**: `from "../generated/prisma/client"` — not from `@prisma/client`. Run `pnpm db:generate` before importing.
- **pnpm-workspace.yaml** has `allowBuilds` for prisma set to `false` — may need adjustment when running prisma generate in CI.
- **`.env.example` files are empty** — you must create `.env` files with the required vars (see `app/backend/api/src/config/` and `app/backend/worker/src/config/` for what is accessed).
- **Worker has own Prisma schema + generated client** at `app/backend/worker/prisma/` and `src/generated/`. Run `pnpm db:generate` to sync both.
- **No tests, no CI, no docker-compose, no linter** (except `oxlint` in frontend/package.json).
- **Express 5** — note breaking changes from Express 4 (e.g., async error handling, route param syntax).
- **TypeScript ~6.0** — newer than most projects. Check for TS 6-specific syntax or breaking changes.
- **Polar webhook** must be registered before `express.json()` (per README note — verify if this is implemented in `app.ts`).

## SDK packages (all implemented)

- Every SDK follows: **hook** (runtime crash announcement) → **normalize** (stack string → StackFrame[]) → **delegate** (core: parseDsn/buildEnvelope/sendEnvelope).
- Golden rule: SDKs **never throw into the host app** — worst case is a console.warn.
- `sdk-core` tsconfig includes DOM lib only for universal-global types (URL/fetch); no `window.*`/`document.*`/node-only APIs allowed in core.
- Build `sdk-core` before typechecking dependents (`pnpm --filter @argusdev/sdk-core build`).
- **Published to npm** under `@argusdev/*` (public; 0.2.0 adds browser web vitals). Package names are `@argusdev/sdk-{core,node,browser,react}` — NOT `@argus/*`. (Note: the api/worker workspace packages are still named `@argus/api`, `@argus/worker` — private, unpublished.)

## Key facts (source-verified)

- Auth is **session-based (Passport)**, not JWT
- Routes are at `/api/v1/auth/...`, `/api/v1/projects/...`, etc.
- Quota is an atomic check-and-consume (`updateMany WHERE count < limit`); malformed payloads still consume 1 event
- **every feature is implemented** — alerts, usage, billing, team/RBAC, and performance (browser vitals + page.load transactions; ingest forks on `type: "transaction"` → `perf-event` job → Transaction rows with `vitals Json`; sdk-browser ≥0.2 captures LCP/CLS/FCP/TTFB, one report per page view on pagehide)
- alerts engine lives in the **worker** (`services/alert.service.ts` + `email.service.ts` + `templates/alertemail.ts`): `evaluateNewIssue` (eventCount===1) + `evaluateErrorRate` (windowed count + cooldown, every event) → email (Resend) + webhook
- billing is **Polar** (`@polar-sh/sdk`, sandbox): checkout/portal/webhook in api; webhook signature needs raw body (captured via `express.json({ verify })` in `app.ts`)
- full React 19 dashboard exists under `app/frontend` (session-cookie auth, React Query + Axios, feature folders), and dogfoods `@argusdev/sdk-react`
- Postgres is hosted on Railway in dev; Redis via REDIS_URL
