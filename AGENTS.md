# Argus — Agent Guide

## Repo structure

```
argus/
├── app/
│   ├── backend/api/       # @argus/api — Express 5 server (ingest + REST API)
│   ├── backend/worker/    # @argus/worker — BullMQ event processor (src/index.ts is empty stub)
│   └── frontend/          # frontend — React 19 + Vite (still default Vite template, not built out)
├── packages/              # SDK packages — currently only a README, no source code
├── infra/                 # Only README — no docker-compose files exist yet
```

Root README and sub-READMEs are aspirational planning docs. **Trust the source code, not the READMEs**, especially for auth, route structure, and schema.

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

## Packages that exist as stubs only

`packages/` has `sdk-core/`, `sdk-browser/`, `sdk-node/`, `sdk-react-native/` described in READMEs but **no actual source directories or package.json files** — only a README.md.

## Miss from root README vs. reality

- Auth is **session-based (Passport)**, not JWT
- Routes are at `/api/auth/...`, `/api/projects/...`, etc. (not `/auth/...`)
- Prisma schema has Organization, Account, Subscription — not in documented schema
- All code is under `app/` subdirectory, not `backend/` and `frontend/` at root
