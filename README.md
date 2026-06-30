# Argus

> Self-hostable error tracking and performance monitoring. Open core.

Argus watches your applications across browser, Node.js, and React Native — capturing errors, grouping them into issues, tracking performance, and alerting you before your users do.

---

## What It Does

- **Error Tracking** — catches uncaught exceptions and unhandled promise rejections, groups duplicates into issues, shows full stack trace + breadcrumb trail
- **Performance Monitoring** — tracks transaction durations, p50/p75/p95 latency, and web vitals (LCP, CLS, TTFB, FCP) across frontend and backend
- **Alerting** — notifies via email or webhook when a new issue appears or error rate exceeds a threshold
- **Free + Pro tiers** — free tier for small projects, Pro for higher volume with Stripe billing

---

## Pricing

| Tier | Events / month | Projects  | Price  |
| ---- | -------------- | --------- | ------ |
| Free | 10,000         | 1         | $0     |
| Pro  | 500,000        | Unlimited | $12/mo |

Events over the free tier limit are silently dropped at the ingest layer. Users see their usage in the dashboard and get prompted to upgrade.

---

## Architecture

```
[sdk-browser]  [sdk-node]  [sdk-react-native]
       │              │              │
       └──────────────┴──────────────┘
                      │
              POST /ingest/:projectId/envelope
                      │
                      ▼
            ┌─────────────────┐
            │   api (Express) │  ← DSN auth → quota check → push to queue
            └────────┬────────┘
                     │  BullMQ — argus:events
                     ▼
            ┌─────────────────┐
            │     worker      │  ← fingerprint → group → write → alert
            └────────┬────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     PostgreSQL  TimescaleDB  Redis
                      │
            ┌─────────────────┐
            │    dashboard    │  ← React app, reads from REST API
            └─────────────────┘
                      │
            ┌─────────────────┐
            │     Stripe      │  ← billing, plan upgrades, webhooks
            └─────────────────┘
```

---

## Folder Structure

```
argus/
├── backend/
│   ├── api/            # Express server — ingest + REST API
│   └── worker/         # BullMQ processor — fingerprinting, grouping, alerting
├── frontend/
│   └── dashboard/      # React 19 dashboard — issues, performance, billing
├── packages/
│   ├── sdk-core/       # Shared SDK utilities (DSN parsing, transport, envelope)
│   ├── sdk-browser/    # Browser SDK — window.onerror, web vitals, breadcrumbs
│   ├── sdk-node/       # Node.js SDK — uncaughtException, Express middleware
│   └── sdk-react-native/ # React Native SDK — JS crash capture
└── infra/
    ├── docker-compose.yml       # Local dev: Postgres/TimescaleDB + Redis
    ├── docker-compose.prod.yml  # Full production stack
    └── migrations/              # TimescaleDB raw SQL migrations
```

---

## Tech Stack

|           | Technology                                              |
| --------- | ------------------------------------------------------- |
| API       | Express 5, TypeScript, Prisma, Zod                      |
| Queue     | BullMQ + Redis                                          |
| Worker    | BullMQ processors, TypeScript                           |
| Database  | PostgreSQL + TimescaleDB                                |
| Email     | Resend                                                  |
| Payments  | Polar                                                   |
| Dashboard | React 19, Vite, Tailwind v4, TanStack Query v5, Zustand |
| SDKs      | TypeScript, zero runtime dependencies                   |
| Monorepo  | pnpm workspaces                                         |

---

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose
- Stripe account (for billing)

---

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/oluwatobicode/argus
cd argus
pnpm install

# 2. Start Postgres + Redis
docker compose -f infra/docker-compose.yml up -d

# 3. Set up environment variables
cp backend/api/.env.example backend/api/.env
cp backend/worker/.env.example backend/worker/.env
cp frontend/dashboard/.env.example frontend/dashboard/.env

# 4. Run Prisma migrations
cd backend/api && pnpm prisma migrate dev --name init && cd ../..

# 5. Run TimescaleDB migrations
psql $DATABASE_URL -f infra/migrations/001_timescale_init.sql
psql $DATABASE_URL -f infra/migrations/002_indexes.sql

# 6. Set up polar webhook (in development) using ngrok
polar listen --forward-to localhost:3001/billing/webhook

# 7. Start everything
pnpm dev
```

---

## Build Phases

### Phase 1 — Core Error Pipeline (MVP)
The bare minimum for the app to actually track errors.

- [ ] Ingest endpoint — `POST /ingest/:projectId/envelope`
- [ ] Fingerprinting — SHA-256 of top 5 stack frames
- [ ] Issue upsert — create new or increment eventCount
- [ ] Event storage — save each raw occurrence
- [ ] Dashboard: Issues list page + Issue detail page
- [ ] API routes: `GET /projects/:pid/issues`, `GET /issues/:id/events`

### Phase 2 — SDKs
The other half of the pipeline — actually capturing errors from user apps.

- [ ] `@argus/sdk-core` — shared types, envelope builder
- [ ] `@argus/sdk-browser` — window.onerror, unhandledrejection, console.error wrapping
- [ ] `@argus/sdk-node` — process.on('uncaughtException'), express error middleware
- [ ] DSN auth middleware — validate public key on ingest

### Phase 3 — Team & Projects
Multi-user, multi-project support.

- [ ] Organization CRUD
- [ ] Organization member management (invite, roles)
- [ ] Project CRUD + project limit (1 for FREE)
- [ ] Dashboard: project settings, team page

### Phase 4 — Production Readiness
Make it survive real traffic.

- [ ] Rate limiter middleware (Redis sliding window)
- [ ] Quota middleware (monthly event limit check)
- [ ] BullMQ worker (move processing off the API server)
- [ ] Redis counter + async sync to Postgres

### Phase 5 — Alerting
Tell users when something breaks.

- [ ] Alert rule CRUD (NEW_ISSUE, ERROR_RATE types)
- [ ] Alert engine in worker
- [ ] Email notifications via Resend
- [ ] Dashboard: alert management page

### Phase 6 — Billing
The business model.

- [ ] Polar checkout session
- [ ] Polar webhook handler
- [ ] Plan enforcement (project limit, quota limit)
- [ ] Dashboard: billing page + usage meter

### Phase 7 — Performance Monitoring
Transactions, spans, web vitals.

- [ ] Transaction/span ingest
- [ ] Web vitals aggregation (LCP, CLS, TTFB, FCP)
- [ ] Performance dashboard (latency charts, span waterfalls)
- [ ] TimescaleDB setup for time-series data

### Phase 8 — Polish
Make it feel like a real product.

- [ ] Source map resolution for stack traces
- [ ] Advanced filtering (date range, level, environment, release)
- [ ] Search across issues
- [ ] `@argus/sdk-react-native`
- [ ] Dark mode / responsive dashboard

---

## Docs

- [Backend](./backend/api/README.md) — API routes, worker pipeline, Prisma schema, env variables
- [Frontend](./frontend/dashboard/README.md) — Pages, design system, auth + billing flow
- [Packages](./packages/README.md) — SDK usage and structure
- [Infra](./infra/README.md) — Docker setup, TimescaleDB migrations
