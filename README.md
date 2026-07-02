# Argus

> Self-hostable error tracking and performance monitoring. Open core.

Argus watches your applications across browser, Node.js, and React — capturing errors, grouping them into issues, tracking performance, and alerting you before your users do.

---

## What It Does

- **Error Tracking** — catches uncaught exceptions and unhandled promise rejections, groups duplicates into issues (SHA-256 stack fingerprinting), shows full stack trace
- **Performance Monitoring** *(planned)* — transaction durations, p50/p75/p95 latency, web vitals (LCP, CLS, TTFB, FCP)
- **Alerting** *(planned)* — email or webhook when a new issue appears or error rate spikes
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
| Dashboard | React 19, Vite, Tailwind v4, TanStack Query v5, Zustand |
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

Smoke-test the pipeline end to end (register → create a project → copy its DSN):

```bash
npx tsx packages/sdk-node/scripts/smoke.mts "<your DSN>"
# → crashes a fake app on purpose; an Issue appears, grouped on rerun
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
- [ ] Dashboard: Issues list page + Issue detail page

### Phase 2 — SDKs ✅ (JS family done)

- [x] `@argus/sdk-core` — DSN parser, envelope builder, transport (never throws, drops on 429)
- [x] `@argus/sdk-node` — uncaughtException/unhandledRejection, V8 stack parser, Express middleware
- [x] `@argus/sdk-browser` — window.onerror, unhandledrejection, Chrome+Firefox stack parsing
- [x] `@argus/sdk-react` — `<ArgusErrorBoundary>` on top of sdk-browser
- [ ] Publish to npm (scope TBD — `@argus` likely taken)
- [ ] `@argus/sdk-react-native`

### Phase 3 — Team & Projects

- [x] Organization auto-creation on signup
- [x] Project CRUD + project limit (1 for FREE)
- [ ] Organization member management (invite, roles)
- [ ] Dashboard: project settings, team page

### Phase 4 — Dashboard

- [ ] Auth pages (register → OTP → login, OAuth)
- [ ] Onboarding: create project → DSN reveal → waiting-for-first-event
- [ ] Issues list + Issue detail (stack trace viewer, resolve/ignore)
- [ ] Dogfood: dashboard monitors itself with `@argus/sdk-react`
- [ ] Design spec: [docs/DESIGN_BRIEF.md](./docs/DESIGN_BRIEF.md)

### Phase 5 — Alerting

- [ ] Alert rule CRUD (NEW_ISSUE, ERROR_RATE types)
- [ ] Alert engine in worker
- [ ] Email notifications via Resend
- [ ] Dashboard: alert management page

### Phase 6 — Billing

- [ ] Polar checkout session + webhook handler
- [ ] Plan enforcement (project limit, quota limit)
- [ ] Dashboard: billing page + usage meter

### Phase 7 — Performance Monitoring

- [ ] Transaction/span ingest
- [ ] Web vitals aggregation (LCP, CLS, TTFB, FCP)
- [ ] TimescaleDB setup for time-series data

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
