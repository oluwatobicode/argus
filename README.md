# Argus

> Self-hostable error tracking and performance monitoring. Open core.

Argus watches your applications across browser, Node.js, and React — capturing errors, grouping them into issues, tracking performance, and alerting you before your users do.

---

## What It Does

- **Error Tracking** — catches uncaught exceptions and unhandled promise rejections, groups duplicates into issues (SHA-256 stack fingerprinting), shows full stack trace
- **Performance Monitoring** — web vitals (LCP, CLS, FCP, TTFB) + page-load transactions with p50/p75/p95 latency (browser; Node timing planned)
- **Alerting** — email (Resend) or webhook on a new issue or an error-rate spike (windowed threshold + cooldown)
- **Free + Pro tiers** — free tier for small projects, Pro for higher volume with Polar billing

---

## Pricing

| Tier | Events / month | Projects  | Price  |
| ---- | -------------- | --------- | ------ |
| Free | 10,000         | 1         | $0     |
| Pro  | 500,000        | Unlimited | $12/mo |

Events over the limit are rejected with `429` at the ingest layer (atomic check-and-consume — bursts can't overshoot). Users see usage in the dashboard and get prompted to upgrade.

---

## Architecture

```
[sdk-browser]  [sdk-node]  [sdk-react]
       │             │           │
       └─────────────┴───────────┘
                     │
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
           │    dashboard    │  ← React app (in progress), reads REST API
           └─────────────────┘
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
│   └── frontend/           # React 19 dashboard (not built yet — see docs/DESIGN_BRIEF.md)
├── packages/
│   ├── sdk-core/           # DSN parsing, envelope builder, transport (shared internals)
│   ├── sdk-node/           # Node SDK — uncaughtException hooks + Express middleware
│   ├── sdk-browser/        # Browser SDK — window.onerror, Chrome+Firefox stack parsing
│   └── sdk-react/          # React SDK — <ArgusErrorBoundary>, re-exports sdk-browser
├── docs/                   # DESIGN_BRIEF.md — dashboard design spec
└── infra/                  # planned: docker-compose, TimescaleDB migrations
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
| Email     | Resend (planned — OTP currently logs to console)        |
| Payments  | Polar                                                   |
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

# 2. Environment variables (no .env.example yet — create by hand)
#    app/backend/api/.env    → DATABASE_URL, REDIS_URL, SESSION_SECRET, FRONTEND_URL,
#                              DSN_HOST, DSN_PROTOCOL (http for dev),
#                              GOOGLE_/GITHUB_ OAuth keys (optional)
#    app/backend/worker/.env → DATABASE_URL, REDIS_URL

# 3. Generate Prisma clients + run migrations
pnpm db:generate
pnpm db:migrate

# 4. Start everything (api + worker + frontend)
pnpm dev
```

Then create a project in the dashboard, install an SDK, and errors start flowing:

```bash
npm install @argusdev/sdk-browser   # or @argusdev/sdk-node, @argusdev/sdk-react
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

### Phase 6 — Billing ✅ (Polar sandbox, verified live — payment → PRO flip)

- [x] Polar checkout session + customer portal + webhook handler (signature-verified)
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
