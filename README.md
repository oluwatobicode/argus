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

| Phase                         | Scope                                                                                       | Status      |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| V1 — Error Tracking + Billing | sdk-browser, sdk-node, ingest, worker, issues dashboard, Stripe billing, email verification | 🔴 Building |
| V2 — Performance Monitoring   | Transactions, web vitals, sdk-react-native, perf dashboard                                  | ⚪ Planned  |
| V3 — Open Core Packaging      | Docker single-binary, source maps, multi-team, Helm                                         | ⚪ Planned  |

---

## Docs

- [Backend](./backend/api/README.md) — API routes, worker pipeline, Prisma schema, env variables
- [Frontend](./frontend/dashboard/README.md) — Pages, design system, auth + billing flow
- [Packages](./packages/README.md) — SDK usage and structure
- [Infra](./infra/README.md) — Docker setup, TimescaleDB migrations
