# Argus — Backend

Two Node.js services. Run both in development (`pnpm dev:api` + `pnpm dev:worker`, or `pnpm dev` from root).

---

## Services

### `api/`

Express 5 server. Two responsibilities:

- Receives raw events from SDKs via the ingest endpoint (DSN-authenticated, rate-limited, quota-checked)
- Serves the REST API to the dashboard (**session-authenticated** — Passport, cookie-based)

Does no heavy processing — validates, quota-checks, queues, and responds immediately.

### `worker/`

BullMQ processor on the `argus-events` queue. Picks up events and does the actual work: fingerprinting, grouping into issues, writing events. (Alerting: planned.)

---

## `api/` Structure

```
api/
├── src/
│   ├── config/
│   │   ├── constants.config.ts       # HTTP statuses, messages, PLAN_EVENT_LIMITS, RATE_LIMIT
│   │   ├── db.config.ts              # Prisma client (@prisma/adapter-pg + pg Pool)
│   │   ├── redis.config.ts           # ioredis client
│   │   ├── session.config.ts         # express-session + connect-redis; connectSessionStore()
│   │   └── passport.config.ts        # local session serialize + Google/GitHub strategies
│   │
│   ├── controllers/
│   │   ├── auth/                     # register (OTP via Redis), verify-otp, send-otp, login,
│   │   │                             #   logout, me, Google/GitHub OAuth callbacks
│   │   ├── projects/                 # CRUD; creation generates DSN (project.id in path) in a
│   │   │                             #   transaction; slug collision → random suffix
│   │   ├── issues/                   # list (paginated + status/level filters), get, update status
│   │   ├── events/                   # list raw events for an issue (paginated)
│   │   ├── ingest/                   # Zod-validate envelope → queue → 200
│   │   ├── performance/ alerts/ billing/ usage/   # STUBS — routes exist, controllers empty
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # ensureAuth — req.isAuthenticated() (Passport session)
│   │   ├── dsnAuth.middleware.ts     # x-sentry-auth header or ?sentry_key → ProjectKey lookup
│   │   ├── rateLimiter.middleware.ts # Redis sliding window, atomic multi() — 100 req/min/project
│   │   ├── quota.middleware.ts       # ATOMIC check-and-consume (updateMany WHERE count < limit)
│   │   └── error.middleware.ts       # global: Zod→400, P2002→409, P2025→404, bad JSON→400, else 500
│   │
│   ├── routes/                       # mounted under /api/v1 in app.ts
│   ├── services/
│   │   ├── queue.service.ts          # BullMQ producer — attempts:3, exponential backoff
│   │   ├── email.service.ts          # Resend (OTP currently logs to console in dev)
│   │   └── otp.service.ts
│   ├── validators/
│   │   └── envelope.validator.ts     # Zod — SOURCE OF TRUTH for envelope shape;
│   │                                 #   timestamps must be ms since epoch (min-bound enforced)
│   ├── utils/                        # password (bcrypt), otp (crypto.randomInt), redis url parse
│   ├── interface/ApiResponse.ts      # sendSuccess / sendError
│   ├── app.ts                        # middleware order, routes, errorHandler LAST
│   └── server.ts                     # prisma connect → redis ping → session store → listen
│
└── prisma/schema.prisma              # full schema (see below)
```

---

## `worker/` Structure

```
worker/
├── src/
│   ├── config/                       # db (own generated client), redis (parsed from REDIS_URL)
│   ├── processors/
│   │   ├── errorEvent.processor.ts   # guard shape (UnrecoverableError) → fingerprint →
│   │   │                             #   upsert Issue → write Event
│   │   └── perfEvent.processor.ts    # stub (Phase 7)
│   ├── services/alert.service.ts     # stub (Phase 5)
│   ├── utils/
│   │   ├── fingerprint.util.ts       # SHA-256 of top 5 frames "filename:function:lineno|…"
│   │   └── sourceMap.util.ts         # stub (Phase 8)
│   ├── types/index.ts                # Envelope/StackFrame — mirrors api validator
│   └── index.ts                      # Worker with job-name routing; unknown names fail
│                                     #   immediately; SIGTERM/SIGINT graceful shutdown
└── prisma/schema.prisma              # duplicate of api schema (dedupe planned)
```

---

## Prisma Schema (actual)

Relations: `User → Account[] (multi-provider) + OrganizationMember[] → Organization → Project[] → ProjectKey[]/Issue[]/Event[]`, plus `Organization → EventQuota[] (per month) + Subscription?`.

Key models — see [api/prisma/schema.prisma](./api/prisma/schema.prisma) for the full source:

- **User** — no password field; credentials live on `Account` (`provider` = EMAIL/GOOGLE/GITHUB, `passwordHash` for EMAIL)
- **Organization** — owns `plan` (FREE/PRO), auto-created at signup, slug globally unique (random-suffixed)
- **Project** — `slug` unique per org; **ProjectKey** holds `publicKey` + `dsn`
- **Issue** — `@@unique([projectId, fingerprint])`, `eventCount`, `firstSeen/lastSeen`, status UNRESOLVED/RESOLVED/IGNORED
- **Event** — raw occurrence: stacktrace/contexts/tags/userContext/request as Json, `timestamp` + `receivedAt`
- **EventQuota** — `@@unique([orgId, month])`, `count` vs `limit` — the atomic quota row
- **AlertRule** — per project: `type` (NEW_ISSUE; ERROR_RATE reserved), `notifyEmail?`/`webhookUrl?`, `enabled`, `lastTriggeredAt`
- **AlertLog** — one row per delivery attempt: `channel` (email/webhook), `target`, `success`, `error?`
- **Transaction/Span/Subscription** — schema ready, features planned

---

## Auth Flow (actual — sessions, not JWT)

```
1. POST /api/v1/auth/register   { name, email, password }
   └─ create User + EMAIL Account (bcrypt) + Organization (OWNER membership)
   └─ 6-char OTP → sha512 hash → Redis (600s TTL) → email (dev: console.log)

2. POST /api/v1/auth/verify-otp { email, otp }   → emailVerified: true

3. POST /api/v1/auth/login      { email, password }
   └─ req.login() → session cookie (Redis store, httpOnly,
      sameSite lax dev / none+secure prod, 7 days)

4. GET  /api/v1/auth/me         → current user + their organization (name, slug, plan)

OAuth: GET /api/v1/auth/google | /github → provider → callback → session → redirect to FRONTEND_URL
```

---

## Ingest + Quota Flow (actual)

```
POST /api/v1/ingest/:projectId/envelope
   │
   ├─ dsnAuth       → publicKey (header x-sentry-auth OR ?sentry_key) → ProjectKey lookup,
   │                  must match :projectId → attaches req.project
   ├─ rateLimiter   → Redis zset, one atomic multi(): trim window + record + count
   │                  > 100/min per project → 429
   ├─ quotaLimit    → EventQuota row (created on first event of month, limit from org plan)
   │                  ATOMIC: updateMany WHERE count < limit SET count = count + 1
   │                  0 rows updated → 429 QUOTA_EXCEEDED (no overshoot under bursts)
   └─ controller    → Zod validate (bad → 400 with issues) → BullMQ add
                      (attempts: 3, exponential backoff) → 200
```

Known trade-off: quota is consumed *before* validation — a malformed payload costs 1 event.

---

## Worker Pipeline (actual)

```
1. Route by job.name     → "error-event" → processor; unknown → UnrecoverableError (no retry)
2. Guard envelope shape  → missing frames/projectId → UnrecoverableError (fail once, no loop)
3. Fingerprint           → SHA-256 of top 5 frames "filename:function:lineno|…"
4. Upsert Issue          → existing fingerprint? eventCount++ + lastSeen; new? INSERT
5. Write Event           → raw occurrence with stacktrace/contexts/tags/user/request JSON
6. Alerts (if new issue) → eventCount === 1 → evaluateNewIssue: enabled NEW_ISSUE rules →
                           email (Resend) + webhook (fetch) → AlertLog per channel; never throws
```

Alerts live entirely in the worker (`services/alert.service.ts`, `services/email.service.ts`,
`templates/alertemail.ts`) — the API only does rule CRUD.

---

## API Routes (all under `/api/v1`)

Auth column: 🍪 = session cookie required.

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` `/auth/login` `/auth/logout` `/auth/verify-otp` `/auth/send-otp` | none | |
| GET | `/auth/me` | 🍪 | |
| GET | `/auth/google` `/auth/github` (+ callbacks) | none | OAuth redirects |
| GET/POST | `/projects` | 🍪 | POST enforces 1-project FREE limit |
| GET/PATCH/DELETE | `/projects/:id` | 🍪 | delete cascades |
| GET | `/projects/:pid/issues` | 🍪 | `?page&limit&status&level` |
| GET/PATCH | `/projects/:pid/issues/:id` | 🍪 | detail incl. 10 latest events / update status |
| GET | `/projects/:pid/issues/:iid/events` | 🍪 | paginated |
| POST | `/ingest/:projectId/envelope` | DSN key | the SDK endpoint |
| GET | `/usage` | 🍪 | org quota (`used`/`limit`/`plan`) + level breakdown |
| GET/POST | `/projects/:pid/alerts` | 🍪 | list / create rule (email &/or webhook) |
| PATCH/DELETE | `/projects/:pid/alerts/:id` | 🍪 | update (incl. enable toggle) / delete |
| — | `/billing/*`, `/projects/:pid/performance/*` | 🍪 | **stubs — hang if called** |

---

## Environment Variables (actual)

### `api/.env`

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=            # PostgreSQL (Railway or local)
REDIS_URL=
SESSION_SECRET=
FRONTEND_URL=http://localhost:5173
DSN_HOST=localhost:3000
DSN_PROTOCOL=http        # https in production
GOOGLE_CLIENT_ID=        # optional — OAuth
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### `worker/.env`

```env
DATABASE_URL=
REDIS_URL=
FRONTEND_URL=http://localhost:5173   # for the "View issue" link in alert emails
RESEND_API_KEY=                      # alerts email (empty → email logged as failed, webhook still works)
FROM_EMAIL=Argus <onboarding@resend.dev>
```

---

## Notes

- **Error handling**: controllers `try/catch → next(error)`; `error.middleware.ts` (mounted last) maps ZodError→400 (with issues), Prisma P2002→409, P2025→404, malformed JSON→400, everything else→500 with server-side logging only.
- **Prisma client import**: `from "../generated/prisma/client"`, not `@prisma/client`. Run `pnpm db:generate` first.
- The worker keeps its **own copy** of the Prisma schema + generated client — keep both in sync (dedupe planned).
- When billing lands: the Polar webhook route must be registered **before** `express.json()` (raw body needed for signature verification). Not yet implemented — current `app.ts` would need reordering.

---

## Build Phases

### Phase 1 — Auth ✅

- [x] Register / OTP / login / logout / me, Google + GitHub OAuth, Redis session store

### Phase 2 — Core Error Pipeline ✅ (verified end-to-end 2026-07-02)

- [x] Ingest endpoint + DSN auth + atomic rate limiter + atomic quota
- [x] BullMQ producer (retries) + worker (routing, guards)
- [x] Fingerprinting, Issue upsert, Event storage
- [x] Projects / Issues / Events REST APIs
- [x] Global error handler
- [x] Usage REST API (`GET /usage`)

### Phase 5 — Alerting ✅ (verified live 2026-07-03 — real email delivered)

- [x] AlertRule / AlertLog models + migration
- [x] Alert rule CRUD (org-scoped, Zod-validated)
- [x] Worker engine — NEW_ISSUE → email (Resend) + webhook, AlertLog
- [ ] ERROR_RATE type (enum reserved; windowed count + cooldown)

### Phase 6 — Billing (Polar) *(planned)*

### Phase 7 — Performance Monitoring *(planned)*
