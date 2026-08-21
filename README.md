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

---

## Pricing

| Tier | Events / month | Projects  | Price  |
| ---- | -------------- | --------- | ------ |
| Free | 10,000         | 1         | $0     |
| Pro  | 500,000        | Unlimited | $5/mo |

Events over the limit are rejected with `429` at the ingest layer (atomic check-and-consume — bursts can't overshoot). Users see usage in the dashboard and get prompted to upgrade.

---

## Architecture

```text
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

```text
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

### Phase 2 — SDKs ✅ (ten packages, published to npm under `@argusdev/*`)

- [x] `@argusdev/sdk-core` — DSN parser, envelope builder, transport (never throws, drops on 429)
- [x] `@argusdev/sdk-node` — process hooks, V8 stack parser, Express middleware, **source context**
- [x] `@argusdev/sdk-browser` — window.onerror, unhandledrejection, web vitals, SSR-safe
- [x] `@argusdev/sdk-react` — `<ArgusErrorBoundary>` on top of sdk-browser
- [x] `@argusdev/sdk-vue` — `argusVue` plugin → `app.config.errorHandler` (works in Nuxt)
- [x] `@argusdev/sdk-angular` — `ErrorHandler` provider, unwraps zone.js/`HttpErrorResponse` wrappers
- [x] `@argusdev/sdk-nextjs` — `/client` + `/server` (`onRequestError`), edge-safe, digest join
- [x] `@argusdev/sdk-svelte` — SvelteKit `handleError` wrappers for both hooks files
- [x] `@argusdev/sdk-nestjs` — global exception filter (Express + Fastify), source context
- [x] `@argusdev/sdk-astro` — one integration: page script + SSR middleware
- [x] `node:test` suites (111 tests) — envelopes validated against the **real** ingest schema and worker fingerprint; framework hooks typechecked against the **real** framework types
- [x] Releases: v0.2 web vitals · v0.3 SSR safety + Node-ESM fix + vue/angular/nextjs/svelte/nestjs/astro · v0.4 source context

### Phase 3 — Team & Projects

- [x] Organization auto-creation on signup
- [x] Project CRUD + project limit (1 for FREE)
- [x] Organization member management (invite, roles / RBAC)
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
- [ ] TimescaleDB when volume demands it (spans + Node timing → Phase 9)

### Phase 8 — Deep Debugging (current)

*From "we capture errors from everywhere" to "we help you fix them".*

- [x] **Source context** (v0.4, 2026-08-18) — server SDKs read the ±5 code lines around each in-app frame at capture; the issue page renders the crashing line highlighted. sdk-node + sdk-nestjs, and sdk-nextjs on the Node runtime (edge bundles verified clean)
- [x] **Live issue feed** — dashboard polls (3s list / 5s detail & counts) so crashes land on screen without a refresh
- [x] Open CORS on ingest — browser SDKs can post from any origin (auth = DSN key, not cookies)
What's next ships as five named sprints — each ends with something a user feels and a camera can film:

#### Sprint 1 — The Trail *(up next)*

- [ ] **Browser breadcrumbs** — console/click/fetch/navigation trail before the crash, ring buffer of 100 (the schema already accepts them); one `sdk-browser` implementation upgrades react/vue/angular/nextjs/svelte/astro at once
- [ ] **Breadcrumb timeline** on the issue page — typed entries, relative times, the crash as the final entry
- [ ] **Release migration rider** — `release` + `environment` columns on Event + two lines in the worker; the SDKs already send both, the pipeline currently drops them, and this data can't be back-filled later

#### Sprint 2 — Find Anything

- [ ] **Filter bar** on the issues feed — by tag (`routePath`, `httpStatus`, `component`…), environment, release, level; combinable and URL-addressable
- [ ] **Text search** over issue title + culprit (Postgres, no new infra)
- [ ] **"N users affected"** per issue — distinct `userContext` count; the number that actually drives triage

#### Sprint 3 — It Came Back

- [ ] **Regression detection** — an event lands on a RESOLVED issue → auto-reopen, mark `REGRESSION`, fire a new alert type
- [ ] **Regression history** on the issue page — resolved in `1.4.1`, back in `1.4.3`
- [ ] **Releases surface** — first/last seen per release; groundwork for a releases page

#### Sprint 4 — Actually Live

- [ ] **SSE push** — worker → Redis pub/sub → API stream; the dashboard drops to polling only as a fallback. Makes the landing page's "streaming live" claim literal

#### Sprint 5 — The Big Rock: Source Maps

- [ ] **Map upload endpoint** per release + storage, auth'd by DSN key
- [ ] **Symbolication in the worker** — minified frames → original file/line, code context from `sourcesContent`, fingerprint on original frames (fixes issues fragmenting across builds)
- [ ] **Upload tooling** — a tiny CLI + Vite/Next plugin

#### Ongoing drip — between sprints, never a dead sprint

- [ ] Deprecate `@argusdev/sdk-node@<=0.2.1` on npm (broken ESM — unloadable in Node)
- [ ] **Retention/TTL cleanup** — nightly worker job deletes events past a plan-based age (unbounded growth today)
- [ ] **GitHub stack-trace linking** — `release` + per-project repo config → open any frame at the exact line on GitHub
- [ ] One backend test file whenever a sprint touches backend code (the app has none today)

### Phase 9 — More Platforms (later)

- [ ] Node/Express timing middleware + spans (schema is ready: `Transaction → Span`)
- [ ] `@argusdev/sdk-go` (git-tag release, not npm), `sdk-java` (dir exists — separate Maven toolchain), React Native, dedicated Nuxt module
- [ ] Uptime / cron monitoring — a second product surface, only once error tracking is deep

---

## Docs

- [AGENTS.md](./AGENTS.md) — envelope contract, repo conventions, gotchas
- [Backend](./app/backend/README.md) — API routes, worker pipeline, Prisma schema
- [Packages](./packages/README.md) — SDK usage and structure
- [Design brief](./docs/DESIGN_BRIEF.md) — dashboard pages, flows, data shapes
