# Argus — Backend

Two Node.js services. Run both in development.

---

## Services

### `api/`

Express server. Two responsibilities:

- Receives raw events from SDKs via the ingest endpoint (DSN-authenticated + quota-checked)
- Serves the REST API to the dashboard (JWT-authenticated)

Does no heavy processing — validates, quota-checks, queues, and responds immediately.

### `worker/`

BullMQ processor. Picks up events from the queue and does all the actual work: fingerprinting, grouping into issues, writing to the database, triggering alerts.

---

## `api/` Structure

```
api/
├── src/
│   ├── config/
│   │   ├── constants.config.ts       # HTTP status codes, error/success messages, plan limits
│   │   ├── db.config.ts              # Prisma client singleton
│   │   └── redis.config.ts           # ioredis client singleton
│   │
│   ├── controllers/
│   │   ├── auth/                     # register, verify-email, login, refresh token, logout
│   │   ├── projects/                 # create project (generates DSN), list, get, update, delete
│   │   ├── issues/                   # list issues (paginated + filtered), get one, update status
│   │   ├── events/                   # list raw events for a specific issue
│   │   ├── performance/              # list transactions, aggregated web vitals
│   │   ├── alerts/                   # CRUD alert rules per project
│   │   ├── billing/                  # create Polar checkout session, billing portal, webhook handler
│   │   ├── usage/                    # get current month event count + limit for authed user
│   │   └── ingest/                   # receive SDK envelope, validate DSN, check quota, push to BullMQ
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # JWT verification + Redis blacklist check
│   │   ├── dsnAuth.middleware.ts     # Parses X-Sentry-Auth header, validates public key for ingest
│   │   ├── quota.middleware.ts       # Checks monthlyEventCount vs plan limit before accepting ingest event
│   │   └── rateLimiter.middleware.ts # Redis sliding window — limits ingest + register endpoints
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── issues.routes.ts
│   │   ├── events.routes.ts
│   │   ├── performance.routes.ts
│   │   ├── alerts.routes.ts
│   │   ├── billing.routes.ts
│   │   ├── usage.routes.ts
│   │   └── ingest.routes.ts
│   │
│   ├── services/
│   │   ├── email.service.ts          # Sends verification, welcome, alert emails via Resend
│   │   ├── polar.service.ts         # Creates checkout sessions, billing portal URLs, handles webhooks
│   │   ├── quota.service.ts          # Increments monthlyEventCount, resets on billing cycle, checks limits
│   │   └── queue.service.ts          # BullMQ producer — adds events to argus:events queue
│   │
│   ├── templates/
│   │   ├── email-verification.ts     # Email verification link template
│   │   ├── welcome.ts                # Welcome email after verification
│   │   └── alert-notification.ts     # Alert rule trigger email template
│   │
│   ├── validators/
│   │   └── envelope.validator.ts     # Zod schema — validates incoming SDK event shape
│   │
│   ├── utils/
│   │   ├── jwt.util.ts               # access + refresh + email verification token helpers
│   │   └── password.util.ts          # bcrypt hash + compare
│   │
│   ├── types/
│   │   ├── jwtpayload.types.ts       # JwtPayload interface
│   │   └── express.d.ts              # Extends Express Request with req.user + req.project
│   │
│   ├── interface/
│   │   └── ApiResponse.ts            # sendSuccess + sendError response helpers
│   │
│   ├── app.ts                        # Express setup, middleware registration, route mounting
│   └── server.ts                     # Prisma connect + server start
│
├── prisma/
│   ├── schema.prisma                 # Full DB schema
│   └── migrations/                   # Migration history
│
└── .env.example
```

---

## `worker/` Structure

```
worker/
├── src/
│   ├── config/
│   │   ├── db.config.ts              # Prisma client singleton
│   │   └── redis.config.ts           # ioredis client singleton
│   │
│   ├── processors/
│   │   ├── errorEvent.processor.ts   # Main pipeline: parse → fingerprint → upsert issue → write event → alert
│   │   └── perfEvent.processor.ts    # Performance pipeline: parse transaction → write to TimescaleDB
│   │
│   ├── services/
│   │   └── alert.service.ts          # Evaluates alert rules for a project → Resend email or webhook POST
│   │
│   ├── utils/
│   │   ├── fingerprint.util.ts       # SHA-256 hash of top 5 stack frames → unique issue identifier
│   │   └── sourceMap.util.ts         # Resolves minified frame → original file + line (V2, stub for now)
│   │
│   ├── types/
│   │   └── index.ts                  # ParsedEvent, StackFrame, Breadcrumb interfaces
│   │
│   └── index.ts                      # Registers BullMQ worker on argus:events, graceful shutdown
│
└── .env.example
```

---

## Prisma Schema

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  password            String
  name                String?
  emailVerified       Boolean   @default(false)
  emailVerifyToken    String?                         // short-lived token sent in verification email
  plan                Plan      @default(FREE)
  monthlyEventCount   Int       @default(0)           // resets each billing cycle
  billingCycleStart   DateTime  @default(now())       // used to know when to reset the counter
  polarCustomerId    String?   @unique
  polarSubId         String?   @unique
  createdAt           DateTime  @default(now())
  projects            Project[]
}

enum Plan {
  FREE    // 10,000 events/month, 1 project
  PRO     // 500,000 events/month, unlimited projects
}

model Project {
  id         String      @id @default(cuid())
  name       String
  slug       String      @unique
  publicKey  String      @unique @default(cuid())     // sent in SDK DSN, validated on ingest
  platform   Platform    @default(JAVASCRIPT)
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  createdAt  DateTime    @default(now())
  issues     Issue[]
  alertRules AlertRule[]
}

enum Platform {
  JAVASCRIPT
  NODE
  REACT_NATIVE
}

model Issue {
  id            String      @id @default(cuid())
  projectId     String
  project       Project     @relation(fields: [projectId], references: [id])
  title         String                                // error message e.g. "TypeError: Cannot read..."
  culprit       String?                               // top frame e.g. "ProductList.tsx:34"
  fingerprint   String                                // SHA-256 of top 5 stack frames
  status        IssueStatus @default(UNRESOLVED)
  level         Level       @default(ERROR)
  eventCount    Int         @default(1)               // incremented on every duplicate
  affectedUsers Int         @default(0)
  firstSeen     DateTime    @default(now())
  lastSeen      DateTime    @default(now())

  @@unique([projectId, fingerprint])
  @@index([projectId, status])
  @@index([projectId, lastSeen])
}

enum IssueStatus {
  UNRESOLVED
  RESOLVED
  IGNORED
}

enum Level {
  FATAL
  ERROR
  WARNING
  INFO
}

model AlertRule {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  type        AlertType
  threshold   Int?                                    // for ERROR_RATE: max events per minute
  notifyEmail String
  webhookUrl  String?
  createdAt   DateTime  @default(now())
  logs        AlertLog[]
}

enum AlertType {
  NEW_ISSUE
  ERROR_RATE
}

model AlertLog {
  id          String    @id @default(cuid())
  alertRuleId String
  alertRule   AlertRule @relation(fields: [alertRuleId], references: [id])
  triggeredAt DateTime  @default(now())
  message     String
}
```

---

## Auth + Verification Flow

```
1. POST /auth/register
   └─ Hash password, create user (emailVerified: false)
   └─ Generate short-lived email verify token (JWT, 24h)
   └─ Send verification email via Resend
   └─ Return 201 — "Check your email"

2. GET /auth/verify-email?token=xxx
   └─ Verify token, set emailVerified: true, clear emailVerifyToken
   └─ Send welcome email
   └─ Redirect to dashboard login

3. POST /auth/login
   └─ Check emailVerified — if false, return 403 "Please verify your email"
   └─ Verify password, return access + refresh tokens
```

---

## Billing Flow (Polar)

```
1. POST /billing/checkout
   └─ Create or retrieve Polar customer for user
   └─ Create Polar Checkout Session (Pro plan price ID)
   └─ Return { url } → frontend redirects user to Polar hosted checkout

2. Polar calls POST /billing/webhook
   └─ checkout.session.completed → set user.plan = PRO, save PolarCustomerId + PolarSubId
   └─ customer.subscription.deleted → set user.plan = FREE
   └─ invoice.payment_failed → send email warning user

3. POST /billing/portal
   └─ Create Polar Billing Portal session for user to manage/cancel subscription
   └─ Return { url } → frontend redirects user
```

---

## Ingest + Quota Flow

Every SDK event hits this chain on the ingest route before it ever touches BullMQ:

```
POST /ingest/:projectId/envelope
   │
   ├─ dsnAuth.middleware    → validate X-Sentry-Auth public key against DB
   ├─ rateLimiter.middleware → Redis: max 100 req/min per project
   ├─ quota.middleware       → check user.monthlyEventCount vs plan limit
   │                           FREE: 10,000 — PRO: 500,000
   │                           over limit? return 429, drop event
   │
   └─ ingest.controller     → validate envelope (Zod) → push to BullMQ → return 200
                               increment user.monthlyEventCount in Redis (fast)
                               Postgres counter synced async every 5 min by a separate BullMQ job
```

---

## Event Envelope (what SDKs POST)

```json
{
  "level": "error",
  "timestamp": 1719859200000,
  "environment": "production",
  "release": "v1.0.0",
  "user": { "id": "user_abc", "email": "user@example.com" },
  "exception": {
    "type": "TypeError",
    "value": "Cannot read properties of undefined (reading 'map')",
    "stacktrace": {
      "frames": [
        {
          "filename": "ProductList.tsx",
          "function": "ProductList",
          "lineno": 34,
          "colno": 12
        },
        { "filename": "App.tsx", "function": "App", "lineno": 10, "colno": 4 }
      ]
    }
  },
  "breadcrumbs": [
    {
      "type": "ui.click",
      "message": "button#checkout",
      "timestamp": 1719859195000
    },
    {
      "type": "http",
      "message": "GET /api/cart 200",
      "timestamp": 1719859198000
    }
  ],
  "context": {
    "browser": { "name": "Chrome", "version": "126.0" },
    "os": { "name": "macOS" }
  },
  "tags": { "plan": "free" }
}
```

---

## Worker Pipeline

```
1. Parse envelope        → validate shape, extract exception + breadcrumbs + context
2. Parse stack frames    → extract top N frames: [{ filename, function, lineno }]
3. Fingerprint           → SHA-256 of top 5 frames joined as "filename:function:lineno|..."
4. Upsert Issue          → fingerprint exists? increment eventCount + update lastSeen
                         → new fingerprint? INSERT new Issue, trigger alert
5. Write raw event       → INSERT into TimescaleDB events table, linked to issue_id
6. Alert engine          → NEW_ISSUE rule? send email via Resend
                         → ERROR_RATE rule? count events in last 60s, fire if over threshold
```

---

## API Routes

### Auth

| Method | Route                | Auth                | Description                                               |
| ------ | -------------------- | ------------------- | --------------------------------------------------------- |
| POST   | `/auth/register`     | None                | Create account, sends verification email                  |
| GET    | `/auth/verify-email` | Token (query param) | Verifies email, activates account                         |
| POST   | `/auth/login`        | None                | Returns access + refresh tokens (requires verified email) |
| POST   | `/auth/refresh`      | Refresh token       | Returns new access token                                  |
| POST   | `/auth/logout`       | JWT                 | Blacklists refresh token                                  |

### Projects

| Method | Route           | Auth | Description                                            |
| ------ | --------------- | ---- | ------------------------------------------------------ |
| GET    | `/projects`     | JWT  | List all projects for authed user                      |
| POST   | `/projects`     | JWT  | Create project — enforces 1 project limit on FREE plan |
| GET    | `/projects/:id` | JWT  | Project detail + DSN key                               |
| PATCH  | `/projects/:id` | JWT  | Rename project                                         |
| DELETE | `/projects/:id` | JWT  | Delete project + all its issues                        |

### Issues

| Method | Route                             | Auth | Description                                         |
| ------ | --------------------------------- | ---- | --------------------------------------------------- |
| GET    | `/projects/:projectId/issues`     | JWT  | Paginated — `?status=UNRESOLVED&level=ERROR&page=1` |
| GET    | `/projects/:projectId/issues/:id` | JWT  | Issue detail + 10 most recent events                |
| PATCH  | `/projects/:projectId/issues/:id` | JWT  | Update status: RESOLVED / IGNORED / UNRESOLVED      |

### Events

| Method | Route                                         | Auth | Description                       |
| ------ | --------------------------------------------- | ---- | --------------------------------- |
| GET    | `/projects/:projectId/issues/:issueId/events` | JWT  | Paginated raw events for an issue |

### Performance

| Method | Route                               | Auth | Description                                  |
| ------ | ----------------------------------- | ---- | -------------------------------------------- |
| GET    | `/projects/:projectId/transactions` | JWT  | List transactions — `?op=http.server&page=1` |
| GET    | `/projects/:projectId/vitals`       | JWT  | Aggregated p50/p75/p95 + web vitals          |

### Alerts

| Method | Route                             | Auth | Description       |
| ------ | --------------------------------- | ---- | ----------------- |
| GET    | `/projects/:projectId/alerts`     | JWT  | List alert rules  |
| POST   | `/projects/:projectId/alerts`     | JWT  | Create alert rule |
| PATCH  | `/projects/:projectId/alerts/:id` | JWT  | Update rule       |
| DELETE | `/projects/:projectId/alerts/:id` | JWT  | Delete rule       |

### Billing

| Method | Route               | Auth            | Description                                             |
| ------ | ------------------- | --------------- | ------------------------------------------------------- |
| POST   | `/billing/checkout` | JWT             | Create Polar Checkout session → returns `{ url }`       |
| POST   | `/billing/portal`   | JWT             | Create Polar Billing Portal session → returns `{ url }` |
| POST   | `/billing/webhook`  | Polar signature | Handles subscription events from Polar                  |

### Usage

| Method | Route    | Auth | Description                                                |
| ------ | -------- | ---- | ---------------------------------------------------------- |
| GET    | `/usage` | JWT  | Returns `{ used, limit, plan, resetDate }` for authed user |

### Ingest (DSN-auth, not JWT)

| Method | Route                         | Auth           | Description                                         |
| ------ | ----------------------------- | -------------- | --------------------------------------------------- |
| POST   | `/ingest/:projectId/envelope` | DSN public key | Receive event from SDK, quota check, push to BullMQ |

---

## Environment Variables

### `api/.env`

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/argus
REDIS_URL=redis://localhost:6379
JWT_SECRET=
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=7d
EMAIL_VERIFY_SECRET=
EMAIL_VERIFY_EXPIRES_IN=24h
RESEND_API_KEY=
ALERT_FROM_EMAIL=alerts@argus.yourdomain.com
POLAR_SECRET_KEY=
POLAR_WEBHOOK_SECRET=
POLAR_PRO_PRICE_ID=
FRONTEND_URL=http://localhost:5173
```

### `worker/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/argus
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=
ALERT_FROM_EMAIL=alerts@argus.yourdomain.com
```

---

## Running Locally

```bash
# From argus root
pnpm dev

# Individually
pnpm --filter api dev
pnpm --filter worker dev

# polar webhook forwarding (separate terminal) with ngrok
polar listen --forward-to localhost:3001/billing/webhook -> we w

# Migrations
cd backend/api && pnpm prisma migrate dev --name init

# Prisma Studio
cd backend/api && pnpm prisma studio

# Reset DB
cd backend/api && pnpm prisma migrate reset
```

---

## Notes

- `quota.middleware.ts` uses Redis as the fast counter (increments on every ingest hit). A separate BullMQ job syncs this Redis counter back to `user.monthlyEventCount` in Postgres every 5 minutes. This avoids a Postgres write on every single event.
- The Polar webhook route must be registered **before** `express.json()` middleware because Polar requires the raw request body to verify the signature.
- FREE plan users are blocked from creating a second project at the controller level (`POST /projects`), not at the middleware level.
- `billingCycleStart` on the User model is used to know when to reset `monthlyEventCount`. For FREE users this resets on the 1st of each month. For PRO users it resets on their Polar subscription renewal date.

---

## Build Phases

### Phase 1 — Auth ✅
- [x] PostgreSQL + Prisma setup
- [x] User model + Account model
- [x] Register with email/password
- [x] OTP generation & verification
- [x] Login with session auth
- [x] Logout / Me endpoint
- [x] Google OAuth strategy
- [x] GitHub OAuth strategy
- [x] Redis session store
- [x] Session config

### Phase 2 — Core Error Pipeline 🔴 Building
- [ ] Ingest endpoint (`POST /ingest/:projectId/envelope`)
- [ ] DSN auth middleware
- [ ] Fingerprinting util (SHA-256 of top 5 frames)
- [ ] Issue upsert (create or increment)
- [ ] Event storage
- [ ] BullMQ queue service (producer)
- [ ] Worker error event processor
- [ ] Projects REST API
- [ ] Issues REST API
- [ ] Events REST API

### Phase 3 — Rate Limiting & Quotas
- [ ] Rate limiter middleware (Redis sliding window)
- [ ] Quota middleware (monthly limit check)
- [ ] Redis counter for fast increments
- [ ] Async counter sync to Postgres
- [ ] Usage REST API

### Phase 4 — Alerting
- [ ] AlertRule model + CRUD routes
- [ ] AlertLog model
- [ ] Alert engine in worker
- [ ] Email notifications via Resend
- [ ] Alerts REST API

### Phase 5 — Billing
- [ ] Polar checkout session creation
- [ ] Polar webhook handler
- [ ] Plan enforcement (project limit, quota limit)
- [ ] Subscription model
- [ ] Billing REST API

### Phase 6 — Performance Monitoring
- [ ] Transaction/span ingest
- [ ] Transaction + Span models
- [ ] TimescaleDB hypertable setup
- [ ] Web vitals aggregation
- [ ] Performance REST API
