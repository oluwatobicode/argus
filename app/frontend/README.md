# Argus — Frontend

React 19 dashboard for viewing issues, performance data, managing alert rules, and upgrading plans.

---

## Structure

```
dashboard/
├── src/
│   ├── assets/                         # Static files: fonts, icons, images
│   │
│   ├── components/
│   │   ├── ui/                         # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx               # Status badges: UNRESOLVED (red), RESOLVED (green), IGNORED (grey)
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── ProgressBar.tsx         # Used for event usage meter
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── issues/
│   │   │   ├── IssueRow.tsx            # Level badge, title, culprit, last seen, event count
│   │   │   ├── IssueFilters.tsx        # Status + level filter tabs
│   │   │   └── StackTrace.tsx          # Collapsible stack frames — app frames highlighted, library frames collapsed
│   │   │
│   │   ├── performance/
│   │   │   ├── VitalsCard.tsx          # Single metric: label, value, rating (good/needs-improvement/poor)
│   │   │   └── TransactionRow.tsx      # Route name, op, p50/p75/p95, volume
│   │   │
│   │   ├── billing/
│   │   │   ├── PlanBadge.tsx           # Small FREE / PRO badge shown in sidebar + settings
│   │   │   ├── UsageMeter.tsx          # Progress bar: X of Y events used this month
│   │   │   └── UpgradeBanner.tsx       # Shown when user hits 80% of free tier limit
│   │   │
│   │   └── layout/
│   │       ├── Sidebar.tsx             # Left nav: project switcher, Issues, Performance, Alerts, Settings + plan badge
│   │       ├── Header.tsx              # Page title + user menu
│   │       └── PageWrapper.tsx         # Consistent padding + max-width container
│   │
│   ├── pages/
│   │   ├── Login.tsx                   # Email + password, redirects to /projects on success
│   │   ├── Register.tsx                # Create account → shows "check your email" screen
│   │   ├── VerifyEmail.tsx             # Handles /verify-email?token=xxx redirect from email link
│   │   ├── Projects.tsx                # Grid of projects, create new modal (blocked on FREE if 1 exists)
│   │   ├── Issues.tsx                  # Paginated issues list, default filter: UNRESOLVED
│   │   ├── IssueDetail.tsx             # Stack trace + breadcrumbs + event list
│   │   ├── Performance.tsx             # Transactions table + web vitals cards
│   │   ├── Alerts.tsx                  # Create/edit/delete alert rules
│   │   ├── Billing.tsx                 # Plan comparison, upgrade CTA, manage subscription link
│   │   └── Settings.tsx                # Project name, DSN key, usage meter, danger zone
│   │
│   ├── hooks/
│   │   ├── useIssues.ts                # GET /projects/:id/issues — paginated + filters
│   │   ├── useIssue.ts                 # GET /projects/:id/issues/:issueId + events
│   │   ├── useMutateIssue.ts           # PATCH issue status
│   │   ├── useProjects.ts              # GET /projects
│   │   ├── useProject.ts               # GET /projects/:id
│   │   ├── usePerformance.ts           # GET transactions + vitals
│   │   ├── useAlerts.ts                # GET + CRUD alert rules
│   │   ├── useUsage.ts                 # GET /usage — { used, limit, plan, resetDate }
│   │   └── useBilling.ts               # POST /billing/checkout, POST /billing/portal
│   │
│   ├── lib/
│   │   ├── api.ts                      # Axios instance — base URL, JWT bearer, silent refresh on 401
│   │   └── queryClient.ts              # TanStack Query client config
│   │
│   ├── store/
│   │   └── auth.store.ts               # Zustand — accessToken, user (includes plan), setAuth(), clearAuth()
│   │
│   ├── types/
│   │   └── index.ts                    # Issue, Event, Project, Transaction, AlertRule, UsageInfo interfaces
│   │
│   ├── App.tsx                         # Route definitions
│   └── main.tsx                        # Root render, QueryClientProvider + RouterProvider
│
├── index.html
├── vite.config.ts                      # Path alias: @/ → src/
├── tailwind.config.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Pages & Routes

| Route                                  | Page              | Notes                                                              |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `/register`                            | `Register.tsx`    | Public. Shows "check your email" on success                        |
| `/verify-email`                        | `VerifyEmail.tsx` | Public. Handles token from email link, redirects to /login         |
| `/login`                               | `Login.tsx`       | Public. Redirects to /projects on success                          |
| `/projects`                            | `Projects.tsx`    | Create new project blocked with upgrade prompt on FREE + 1 project |
| `/projects/:projectId/issues`          | `Issues.tsx`      | Default filter: UNRESOLVED                                         |
| `/projects/:projectId/issues/:issueId` | `IssueDetail.tsx` | Stack trace, breadcrumbs, event list                               |
| `/projects/:projectId/performance`     | `Performance.tsx` | Transactions + web vitals                                          |
| `/projects/:projectId/alerts`          | `Alerts.tsx`      | Alert rule management                                              |
| `/projects/:projectId/settings`        | `Settings.tsx`    | DSN, usage meter, rename, delete                                   |
| `/billing`                             | `Billing.tsx`     | Plan comparison, Polar checkout CTA, manage subscription           |

All routes except `/register`, `/login`, `/verify-email` require a valid access token.

---

## Billing Flow (Frontend Side)

```
User clicks "Upgrade to Pro"
    │
    ▼
POST /billing/checkout
    │
    ▼
Redirect to Polar hosted checkout (polar.dev)
    │
    ▼
Polar redirects back to /billing?success=true
    │
    ▼
Invalidate useUsage + auth store queries → UI updates to PRO
```

```
User clicks "Manage Subscription"
    │
    ▼
POST /billing/portal
    │
    ▼
Redirect to Polar Billing Portal (cancel, update card etc.)
```

---

## Usage Meter

`useUsage` fetches `{ used, limit, plan, resetDate }` and feeds into:

- `UsageMeter.tsx` on the Settings page — full progress bar with percentage
- `UpgradeBanner.tsx` — appears site-wide when `used / limit >= 0.8` on FREE plan
- Sidebar footer — small `X / 10k events` label under the plan badge

When a FREE user hits 100% of their limit, ingest events are silently dropped by the API (returns 429). The dashboard shows a prominent banner prompting upgrade.

---

## Design System

Dark, minimal, developer-tool aesthetic.

### Colors

```css
--color-bg: #0a0a0a; /* page background */
--color-surface: #111111; /* cards, sidebar, modals */
--color-border: #1f1f1f; /* dividers */
--color-muted: #6b7280; /* secondary text, timestamps */
--color-text: #f5f5f5; /* primary text */

/* Issue level */
--color-fatal: #f87171;
--color-error: #f87171;
--color-warning: #fbbf24;
--color-info: #60a5fa;

/* Issue status */
--badge-unresolved: #ef4444;
--badge-resolved: #22c55e;
--badge-ignored: #6b7280;

/* Web vitals */
--vitals-good: #34d399;
--vitals-meh: #fbbf24;
--vitals-poor: #f87171;

/* Plan badges */
--plan-free: #6b7280;
--plan-pro: #a78bfa; /* purple — distinct from everything else */

/* Usage meter */
--usage-ok: #34d399; /* 0–79% */
--usage-warning: #fbbf24; /* 80–99% */
--usage-full: #f87171; /* 100% */
```

### Typography

```
Headings + UI:  Inter
Stack frames:   JetBrains Mono  (filenames, line numbers, DSN key, event IDs)
```

---

## Auth Pattern

Access token lives in Zustand (memory only — never localStorage). Refresh token is an httpOnly cookie.

On app load, `api.ts` silently calls `POST /auth/refresh` to restore the access token from the cookie. On any 401, the interceptor retries once after refreshing. If refresh fails → `clearAuth()` → redirect to `/login`.

The `user` object stored in Zustand includes `plan: 'FREE' | 'PRO'` so plan-gating in the UI (upgrade prompts, project creation limits) reads from there without an extra API call.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3001
```

---

## Running Locally

```bash
pnpm --filter dashboard dev    # from root
pnpm dev                       # from dashboard/

pnpm --filter dashboard build
pnpm --filter dashboard preview
```

Runs on `http://localhost:5173`.

---

## Build Phases

### Phase 1 — Auth UI 🔴 Building
- [ ] Login page
- [ ] Register page
- [ ] Verify email page
- [ ] Auth store (Zustand)
- [ ] API client with silent refresh

### Phase 2 — Issues Dashboard
- [ ] Projects list page
- [ ] Create project modal
- [ ] Issues list (paginated, filtered by status/level)
- [ ] Issue detail page (stack trace, breadcrumbs, events)
- [ ] IssueRow, IssueFilters, StackTrace components
- [ ] Layout: Sidebar, Header, PageWrapper

### Phase 3 — Project Settings
- [ ] Settings page (rename, DSN key, danger zone)
- [ ] Usage meter component
- [ ] Plan badge in sidebar

### Phase 4 — Alerting UI
- [ ] Alerts management page
- [ ] Create/edit alert rule form
- [ ] Alert log display

### Phase 5 — Billing UI
- [ ] Billing page (plan comparison, upgrade CTA)
- [ ] Upgrade banner (80% usage warning)
- [ ] Manage subscription flow

### Phase 6 — Performance Dashboard
- [ ] Performance page (transactions table)
- [ ] Web vitals cards (LCP, CLS, TTFB, FCP)
- [ ] VitalsCard, TransactionRow components

### Phase 7 — Polish
- [ ] Empty states for all lists
- [ ] Loading spinners throughout
- [ ] Error boundaries
- [ ] Responsive layout
