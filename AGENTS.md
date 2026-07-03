# Argus — Agent Guide

## Repo structure

```
argus/
├── app/
│   ├── backend/api/       # @argus/api — Express 5 server (ingest + REST API) — WORKING
│   ├── backend/worker/    # @argus/worker — BullMQ event processor — WORKING (verified e2e)
│   └── frontend/          # frontend — React 19 + Vite (still default Vite template, not built out)
├── packages/              # @argus/sdk-core, sdk-node, sdk-browser, sdk-react — all implemented,
│                          #   typechecked; sdk-node verified live; NOT published to npm
├── docs/                  # DESIGN_BRIEF.md — dashboard design spec
├── infra/                 # Only README — no docker-compose files exist yet
```

READMEs were rewritten 2026-07-03 to match the source. Still: **when in doubt, trust the source code**, especially for auth, route structure, and schema.

## Key architecture (from actual source)

- **Auth**: Passport session-based (serialize/deserialize User). Routes mounted under `/api/` prefix. Register → OTP sent via Redis (600s TTL) → verify OTP → login → session cookie. Google + GitHub OAuth strategies.
- **Prisma**: Client generated to `app/backend/api/src/generated/prisma/`. Uses `@prisma/adapter-pg` (not the default driver). Schema: User → Account (multi-provider), Organization → OrganizationMember, Project → ProjectKey, Issue → Event, Transaction → Span, Subscription, EventQuota.
- **Worker**: BullMQ Worker consuming from `argus-events` queue. Error pipeline: parse envelope → SHA-256 fingerprint → upsert Issue → write Event.
- **Frontend**: Vite default template. No dashboard code yet.

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
- **Frontend is scaffold-only**: `src/App.tsx` is the default Vite boilerplate. No TanStack Query, Zustand, or dashboard code exists yet.
- **No tests, no CI, no docker-compose, no linter** (except `oxlint` in frontend/package.json).
- **Express 5** — note breaking changes from Express 4 (e.g., async error handling, route param syntax).
- **TypeScript ~6.0** — newer than most projects. Check for TS 6-specific syntax or breaking changes.
- **Polar webhook** must be registered before `express.json()` (per README note — verify if this is implemented in `app.ts`).

## SDK packages (all implemented)

- Every SDK follows: **hook** (runtime crash announcement) → **normalize** (stack string → StackFrame[]) → **delegate** (core: parseDsn/buildEnvelope/sendEnvelope).
- Golden rule: SDKs **never throw into the host app** — worst case is a console.warn.
- `sdk-core` tsconfig includes DOM lib only for universal-global types (URL/fetch); no `window.*`/`document.*`/node-only APIs allowed in core.
- Build `sdk-core` before typechecking dependents (`pnpm --filter @argus/sdk-core build`).
- Smoke tests (run from repo root, API+worker up): `npx tsx packages/sdk-{core,node}/scripts/smoke.mts "<dsn>"`.
- Not on npm yet; `@argus` scope likely taken — rename at publish time.

## Key facts (source-verified)

- Auth is **session-based (Passport)**, not JWT
- Routes are at `/api/v1/auth/...`, `/api/v1/projects/...`, etc.
- Quota is an atomic check-and-consume (`updateMany WHERE count < limit`); malformed payloads still consume 1 event
- alerts + usage are **implemented**; **performance + billing** controllers are still **empty stubs — requests to them hang**
- alerts engine lives in the **worker** (`services/alert.service.ts` + `email.service.ts` + `templates/alertemail.ts`); fires on new issue (eventCount===1) → email (Resend) + webhook
- full React 19 dashboard exists under `app/frontend` (session-cookie auth, React Query + Axios, feature folders)
- Postgres is hosted on Railway in dev; Redis via REDIS_URL
