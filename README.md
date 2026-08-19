# Argus

> Self-hostable error tracking and performance monitoring. Open core.

Argus watches your applications across **ten SDKs** — browser, Node, React, Next.js, Vue, Angular, Svelte, Astro, and NestJS — capturing errors, grouping them into issues, showing the broken code, tracking performance, and alerting you before your users do.

---

## What It Does

- **Error Tracking** — catches what each runtime actually swallows (error boundaries, `app.config.errorHandler`, zone.js, `onRequestError`, `handleError`, exception filters — not just `window.onerror`), groups duplicates into issues (SHA-256 stack fingerprinting), shows the full stack trace
- **Source Context** — server SDKs ship the ±5 lines of code around each in-app frame at capture time; the issue page renders the crashing line highlighted. No source maps, no build step
- **Live Issue Feed** — new errors land on the dashboard within ~3s of happening, no refresh
- **Performance Monitoring** — web vitals (LCP, CLS, FCP, TTFB) + page-load transactions with p50/p75/p95 latency (browser; Node timing planned)
- **Alerting** — email (Resend) or webhook on a new issue or an error-rate spike (windowed threshold + cooldown)
- **Teams & Billing** — organizations with member roles, per-plan quotas (atomic check-and-consume), Free + Pro tiers via Bachs billing

-------
## Pricing

| Tier | Events / month | Projects  | Price  |
| ---- | -------------- | --------- | ------ |
| Free | 10,000         | 1         | $0     |
| Pro  | 500,000        | Unlimited | $5/mo |

Events over the limit are rejected with `429` at the ingest layer (atomic check-and-consume — bursts can't overshoot). Users see usage in the dashboard and get prompted to upgrade.

---

## Architecture

```
[browser] [react] [vue] [angular] [nextjs] [svelte] [astro]   [node] [nestjs]
     │        │      │       │        │        │       │         │      │
     └────────┴──────┴───────┴────────┴────────┴───────┴─────────┴──────┘
                     │            (all delegate to sdk-core)
     POST /api/v1/ingest/:projectId/envelope
                     │
                     ▼
           ┌─────────────────┐
           │   api (Express) │  ← DSN auth → rate limit → atomic quota → validate → queue
           └────────┬────────┘
                    │  BullMQ — argus-events
                    ▼
           ┌─────────────────┐
           │     worker      │  ← fingerprint → upsert Issue → write Event
           └────────┬────────┘
                    │
              ┌─────┴─────┐
              ▼           ▼
         PostgreSQL     Redis
                    │
           ┌─────────────────┐
           │    dashboard    │  ← React 19 app — live issue feed, source context,
           └─────────────────┘    performance, alerts, team, billing
```

**Envelope contract:** all timestamps are **milliseconds** since epoch (`Date.now()`), enforced at ingest. DSN format: `http(s)://<publicKey>@<host>/<projectId>`. See [AGENTS.md](./AGENTS.md).

---

## Folder Structure

```
argus/
├── app/
│   ├── backend/
│   │   ├── api/            # Express 5 — ingest + REST API (session auth via Passport)
│   │   └── worker/         # BullMQ processor — fingerprinting, grouping
│   └── frontend/           # React 19 dashboard (dogfoods @argusdev/sdk-react)
├── packages/
│   ├── sdk-core/           # DSN parsing, envelope builder, transport (shared internals)
│   ├── sdk-node/           # Node — process hooks, Express middleware, source context
│   ├── sdk-browser/        # Browser — window.onerror, stack parsing, web vitals, SSR-safe
│   ├── sdk-react/          # <ArgusErrorBoundary> on top of sdk-browser
│   ├── sdk-vue/            # argusVue plugin → app.config.errorHandler
│   ├── sdk-angular/        # ErrorHandler provider + Angular wrapper unwrapping
│   ├── sdk-nextjs/         # /client + /server (onRequestError), edge-safe
│   ├── sdk-svelte/         # SvelteKit handleError wrappers (client + server)
│   ├── sdk-nestjs/         # global exception filter (Express + Fastify adapters)
│   ├── sdk-astro/          # one integration: page script + SSR middleware
│   └── tests/              # integration suite — envelopes vs the REAL ingest validator
├── docs/                   # DESIGN_BRIEF.md — dashboard design spec
└── infra/                  # docker-compose (dev deps + full stack), Dockerfiles
```

---

## Tech Stack

|           | Technology                                              |
| --------- | ------------------------------------------------------- |
| API       | Express 5, TypeScript, Prisma (pg adapter), Zod         |
| Auth      | Passport sessions (email+OTP, Google, GitHub OAuth)     |
| Queue     | BullMQ + Redis                                          |
| Worker    | BullMQ processors, TypeScript                           |
| Database  | PostgreSQL (TimescaleDB planned for perf data)          |
| Email     | Resend (alert emails verified live)                     |
| Payments  | Bachs                                                   |
| Dashboard | React 19, Vite, Tailwind v4, TanStack Query v5, Axios, react-hook-form + Zod |
| SDKs      | TypeScript, zero runtime dependencies                   |
| Monorepo  | pnpm workspaces                                         |

---

## Getting Started

Prerequisites: Node >= 20, pnpm >= 9, a PostgreSQL database and a Redis instance (local or hosted — Railway works).

```bash
# 1. Clone and install
git clone https://github.com/oluwatobicode/argus
cd argus
pnpm install

# 2. Environment variables
#    Option A — Docker deps only (Postgres + Redis):
#      pnpm docker:deps
#      Copy values from infra/.env.docker into app/backend/api/.env and app/backend/worker/.env
#    Option B — Full Docker stack: see infra/README.md

# 3. Generate Prisma clients + run migrations
pnpm db:generate
pnpm db:migrate

# 4. Start everything (api + worker + frontend)
pnpm dev
```

Then create a project in the dashboard, install an SDK, and errors start flowing:

```bash
npm install @argusdev/sdk-nextjs    # or sdk-{react,vue,angular,svelte,astro,nestjs,node,browser}
```

---

## Build Phases

### Phase 1 — Core Error Pipeline (MVP) ✅ (backend done, verified end-to-end)

- [x] Ingest endpoint — `POST /api/v1/ingest/:projectId/envelope`
- [x] DSN auth middleware — validate public key on ingest
- [x] Rate limiter middleware (Redis sliding window, atomic)
- [x] Quota middleware (atomic monthly check-and-consume)
- [x] BullMQ queue service (producer, retries + backoff)
- [x] Fingerprinting — SHA-256 of top 5 stack frames
- [x] Issue upsert — create new or increment eventCount
- [x] Event storage — save each raw occurrence
- [x] BullMQ worker (job-name routing, malformed-payload guards)
- [x] API routes: issues list/detail/status, events list (paginated + filtered)
- [x] Dashboard: Issues list page + Issue detail page

### Phase 2 — SDKs ✅ (published to npm under `@argusdev/*`)

- [x] `@argusdev/sdk-core` — DSN parser, envelope builder, transport (never throws, drops on 429)
- [x] `@argusdev/sdk-node` — uncaughtException/unhandledRejection, V8 stack parser, Express middleware
- [x] `@argusdev/sdk-browser` — window.onerror, unhandledrejection, Chrome+Firefox stack parsing
- [x] `@argusdev/sdk-react` — `<ArgusErrorBoundary>` on top of sdk-browser
- [x] Published to npm (`@argusdev` scope, v0.1.0, public)
- [ ] `@argusdev/sdk-react-native`

### Phase 3 — Team & Projects

- [x] Organization auto-creation on signup
- [x] Project CRUD + project limit (1 for FREE)
- [ ] Organization member management (invite, roles)
- [x] Dashboard: project settings page

### Phase 4 — Dashboard ✅ (React 19, session auth)

- [x] Auth pages (register → OTP → login, OAuth buttons)
- [x] Projects console + create modal + onboarding DSN reveal (waiting-for-first-event)
- [x] Issues list + Issue detail (stack-trace stepper, resolve/ignore)
- [x] Settings (rename, DSN reveal, framework install tabs, delete) + Usage meter
- [x] Dogfood: dashboard monitors itself with `@argusdev/sdk-react` (verified — live browser crash)
- [x] Design spec: [docs/DESIGN_BRIEF.md](./docs/DESIGN_BRIEF.md)

### Phase 5 — Alerting ✅ (verified live — real emails delivered)

- [x] Alert rule CRUD — both NEW_ISSUE and ERROR_RATE (windowed threshold + cooldown)
- [x] Alert engine in worker (new-issue + error-rate, per-event)
- [x] Email notifications via Resend + webhook (POST) delivery, AlertLog
- [x] Dashboard: alert management page (type selector, threshold/window)

### Phase 6 — Billing ✅ (Bachs sandbox, verified live — payment → PRO flip)

- [x] Bachs checkout session + cancel subscription + webhook handler (HMAC-SHA256 signature-verified)
- [x] Plan enforcement — org PRO flip + quota ceiling synced mid-cycle
- [x] Dashboard: billing page (upgrade / manage) + usage meter

### Phase 7 — Performance Monitoring ✅ (browser MVP, dogfood-verified 2026-07-06)

- [x] Transaction ingest (`type: "transaction"` envelopes → `perf-event` jobs)
- [x] Web vitals capture in sdk-browser (LCP, CLS, FCP, TTFB — one report per page view)
- [x] Aggregation API: p50/p75/p95 per transaction name + p75 vitals with ratings
- [x] Dashboard: Performance page (vitals cards + transactions table, 24h/7d/30d)
- [ ] Node/Express timing middleware + spans
- [ ] TimescaleDB when volume demands it

### Phase 8 — Polish

- [ ] Source map resolution for stack traces
- [ ] Fingerprint normalization (minified linenos fragment issues across releases)
- [ ] Advanced filtering + search across issues
- [ ] More SDKs: Vue, React Native, Go

---

## Docs

- [AGENTS.md](./AGENTS.md) — envelope contract, repo conventions, gotchas
- [Backend](./app/backend/README.md) — API routes, worker pipeline, Prisma schema
- [Packages](./packages/README.md) — SDK usage and structure
- [Design brief](./docs/DESIGN_BRIEF.md) — dashboard pages, flows, data shapes
