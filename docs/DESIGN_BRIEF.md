# Argus — Dashboard Design Brief

> A design brief for the Argus web dashboard. Everything marked ✅ is a working API you can design against today; 🔜 is planned and should be designed as future nav items / empty states.

---

## 1. What Argus Is

**Argus is a self-hostable error tracking and performance monitoring tool** (think: an open-core Sentry alternative). Developers install a small SDK into their app; when their app crashes, the error is sent to Argus, which **groups duplicate errors into "Issues"**, counts them, and shows them in this dashboard so developers can find and fix bugs before users complain.

**Target user:** developers (solo devs and small teams). They live in dark-mode IDEs, love monospace fonts for code/stack traces, and want information density over decoration.

**Tech the dashboard will be built with:** React 19, Vite, Tailwind v4, TanStack Query v5, Zustand.

**Brand feel:** developer-tool aesthetic — precise, fast, calm. Reference points: Sentry, Vercel, Linear, Resend. Dark mode first.

---

## 2. Core Concepts (the mental model)

```
User ──belongs to──> Organization ──has──> Projects ──have──> Issues ──have──> Events
                          │
                          └── has a Plan (FREE / PRO) + monthly event quota
```

| Concept | What it is | Key fields available from API |
|---|---|---|
| **User** | The logged-in developer | `id, name, email, avatarUrl, emailVerified` |
| **Organization** | Auto-created at signup ("Tobi's Organization") | `name, slug, plan (FREE/PRO)` |
| **Project** | One app being monitored (e.g. "my-shop-frontend") | `id, name, slug, platform?, keys[] (DSN)` |
| **Issue** | A *group* of identical errors (deduplicated by stack fingerprint) | `id, title, culprit, status, level, eventCount, firstSeen, lastSeen` |
| **Event** | One raw occurrence of an error | `id, level, message, stacktrace (frames), tags, userContext, request, contexts (browser/os), timestamp` |
| **DSN** | The secret-ish URL a developer pastes into their SDK: `https://<publicKey>@host/<projectId>` | shown once at project creation, copyable |

**The magic moment:** a developer's app throws the same `TypeError` 500 times → Argus shows **one Issue** with `eventCount: 500`, not 500 rows.

**Issue statuses:** `UNRESOLVED` (default, needs attention) → `RESOLVED` (fixed) or `IGNORED` (muted).
**Issue/Event levels:** `FATAL, ERROR, WARNING, INFO, DEBUG` — color-coded (fatal=dark red, error=red, warning=amber, info=blue, debug=gray).

---

## 3. Pages & User Flows

### 3.1 Auth flow ✅

```
Register → Verify OTP → Login → Dashboard
   │            │
   └── or "Continue with Google / GitHub" (skips OTP) ──> Dashboard
```

1. **Register page** — name, email, password. On success: "check your email for a 6-character code" → OTP screen.
2. **Verify OTP page** — 6-character alphanumeric code input (code like `A7K2P9`), resend button.
3. **Login page** — email + password, Google button, GitHub button. Session cookie-based (no tokens to display).
4. Wrong login → generic "Invalid email or password".

### 3.2 First-run / onboarding flow ✅

After first login the user has **zero projects** → show a strong empty state:

1. "Create your first project" → modal/form: just a **name** (e.g. "my-shop").
2. On creation the API returns the project **with its DSN**. Show a "Your DSN" reveal screen with:
   - the DSN in a copyable code block
   - an SDK install snippet (`npm install @argus/sdk-browser` + 3-line init code)
   - "Waiting for your first event…" state that flips to "🎉 Event received" (poll issues list)
3. **FREE plan = 1 project max.** Attempting a 2nd project returns an error → show upgrade prompt.

### 3.3 Issues list — THE core page ✅

Route: `/projects/:projectId/issues` — this is where users spend 80% of their time. Reference: Sentry's issue stream / Linear's list density.

**Layout:** a dense table/list of issue rows, each row showing:
- **level badge** (colored dot or chip: ERROR red, WARNING amber…)
- **title** (e.g. `TypeError: Cannot read properties of undefined (reading 'map')`) — monospace, truncated
- **culprit** below title, dimmer (e.g. `src/components/IssueList.tsx:42`)
- **eventCount** (big-ish number, right side — "×503")
- **lastSeen** relative time ("2m ago") and **firstSeen** ("first seen 3d ago")
- **status** (unresolved rows look "active"; resolved look dimmed/struck)

**Controls above the list:**
- status tabs/filter: **Unresolved | Resolved | Ignored** (server param `?status=`)
- level filter dropdown (`?level=ERROR`)
- pagination (server returns `{ page, limit, total, pages }`), default sort = most recently seen first

**Row click → Issue detail page.**

**Empty states needed:** no issues yet (happy: "No errors — nice."), no results for filter.

### 3.4 Issue detail page ✅

Route: `/projects/:projectId/issues/:issueId`. The API returns the issue **plus its 10 latest events**.

**Header zone:**
- level badge + issue title (monospace)
- culprit line
- stats strip: `eventCount`, firstSeen, lastSeen
- **action buttons: "Resolve" / "Ignore"** (PATCH status; Resolved state shows "Unresolve")

**Body — the star of the page is the stack trace viewer:**
- one raw Event rendered as a **stack trace**: ordered frames, each showing `function` + `filename:lineno:colno`, monospace, top frame emphasized (it's the crash site)
- **context chips/panels** from the event: browser + OS (e.g. "Chrome 126 · macOS 14.5"), environment ("production"), release ("1.0.0"), user (`id`/`email` of the *affected end-user*), request (`GET https://myapp.com/dashboard`), tags (key:value chips)
- event navigator: "Event 1 of N" with older/newer arrows, or a small list of recent events with timestamps → clicking loads that event's stack trace (paginated via events endpoint)

### 3.5 Projects & settings ✅

- **Projects list** (`/projects`) — cards or rows: name, platform icon, created date. Click → that project's issues.
- **Project settings** — rename, view DSN (copy button), delete project (danger zone with confirm).

### 3.6 Usage page 🔜 (API stubbed, shape known)

- monthly event quota meter: `count / limit` (FREE = 10,000/mo, PRO = 500,000/mo)
- progress bar that goes amber at ~80%, red at 100% with "events are being dropped" warning + upgrade CTA

### 3.7 Billing page 🔜 (Polar, not Stripe)

- current plan card (FREE/PRO), upgrade button → Polar checkout, manage subscription → Polar portal
- pricing: FREE $0 (10k events, 1 project) / PRO $12/mo (500k events, unlimited projects)

### 3.8 Alerts page 🔜

- list of alert rules per project; create rule: type = "New issue" or "Error rate threshold", channel = email/webhook

### 3.9 Performance page 🔜

- transactions table (name, p50/p75/p95 latency), web vitals cards (LCP, CLS, TTFB, FCP)

**Nav structure suggestion (sidebar):** Project switcher on top, then: Issues · Performance 🔜 · Alerts 🔜 · Usage · Settings. Org-level: Billing 🔜. Bottom: user avatar menu (profile, logout).

---

## 4. API Reference (what the dashboard calls)

Base URL: `/api/v1`. Auth = session cookie (`credentials: "include"`). All responses share this shape:

```json
{ "statusCode": 200, "status": "success", "message": "…", "data": { } }
```
Errors: `{ "statusCode": 4xx, "status": "failed", "message": "…", "error": … }`

### Auth ✅
| Method + path | Body | Notes |
|---|---|---|
| `POST /auth/register` | `{ name, email, password }` | triggers OTP email |
| `POST /auth/verify-otp` | `{ email, otp }` | 6-char code, 10 min TTL |
| `POST /auth/send-otp` | `{ email }` | resend |
| `POST /auth/login` | `{ email, password }` | sets session cookie |
| `POST /auth/logout` | — | |
| `GET /auth/me` | — | current user object |
| `GET /auth/google` / `GET /auth/github` | — | OAuth redirects |

### Projects ✅
| | |
|---|---|
| `GET /projects` | list, each with `keys[]` (contains `dsn`, `publicKey`) |
| `POST /projects` | `{ name }` → 201 with project + DSN. FREE plan: 400 on 2nd project |
| `GET /projects/:id` | |
| `PATCH /projects/:id` | `{ name }` |
| `DELETE /projects/:id` | cascades all issues/events |

### Issues ✅
| | |
|---|---|
| `GET /projects/:pid/issues?page&limit&status&level` | paginated: `{ issues[], pagination: { page, limit, total, pages } }` |
| `GET /projects/:pid/issues/:id` | issue + latest 10 events embedded |
| `PATCH /projects/:pid/issues/:id` | `{ status: "RESOLVED" \| "UNRESOLVED" \| "IGNORED" }` |

### Events ✅
| | |
|---|---|
| `GET /projects/:pid/issues/:iid/events?page&limit` | paginated raw events, newest first |

### Stubbed 🔜 (design nav/empty states only)
`GET /usage` · `POST /billing/checkout` · `POST /billing/portal` · `GET/POST/PATCH/DELETE /projects/:pid/alerts` · `GET /projects/:pid/performance/transactions` · `GET /projects/:pid/performance/vitals`

---

## 5. Real Data Shapes (design with these exact fields)

**Issue (list row):**
```json
{
  "id": "cmr1x…",
  "title": "TypeError: Cannot read properties of undefined (reading 'map')",
  "culprit": "src/components/IssueList.tsx:42",
  "status": "UNRESOLVED",
  "level": "ERROR",
  "eventCount": 503,
  "firstSeen": "2026-06-29T21:14:03.000Z",
  "lastSeen": "2026-07-02T23:58:11.000Z"
}
```

**Event (detail view):**
```json
{
  "level": "ERROR",
  "message": "TypeError: Cannot read properties of undefined (reading 'map')",
  "stacktrace": {
    "frames": [
      { "filename": "src/components/IssueList.tsx", "function": "renderIssues", "lineno": 42, "colno": 17 },
      { "filename": "src/components/IssueList.tsx", "function": "IssueList", "lineno": 18, "colno": 5 },
      { "filename": "node_modules/react-dom/client.js", "function": "renderWithHooks", "lineno": 1103, "colno": 22 }
    ]
  },
  "contexts": { "browser": { "name": "Chrome", "version": "126.0" }, "os": { "name": "macOS", "version": "14.5" } },
  "tags": { "browser": "chrome", "page": "/dashboard" },
  "userContext": { "id": "user-123", "email": "test@example.com" },
  "request": { "url": "https://myapp.com/dashboard", "method": "GET" },
  "timestamp": "2026-07-02T23:58:11.000Z"
}
```

**Project:**
```json
{
  "id": "cmr1cscyr0000sqvagsx33iri",
  "name": "my-shop",
  "slug": "my-shop",
  "platform": null,
  "keys": [{ "publicKey": "ed533eb8-…", "dsn": "https://ed533eb8-…@localhost:3000/cmr1cscyr0000sqvagsx33iri" }]
}
```

---

## 6. Design Priorities

1. **Issues list + Issue detail** — the product *is* these two pages. Get density, hierarchy, and the stack-trace viewer right.
2. **Onboarding** (create project → DSN reveal → waiting-for-first-event) — the make-or-break first 5 minutes.
3. Auth screens, projects list/settings.
4. Usage meter, then shells/empty states for Billing, Alerts, Performance.

**Do:** dark mode default, monospace for anything code-ish (titles, culprits, frames, DSN), relative timestamps with absolute on hover, color = level/status only.
**Avoid:** marketing-site airiness, illustrations in core flows, hiding data behind hovers.
