# Argus — Frontend

React 19 dashboard: auth, projects console, issues, settings, usage, alert rules, and billing. Session-cookie auth (no tokens). Dogfoods `@argusdev/sdk-react` — the dashboard reports its own crashes to Argus.

Engineering conventions live in [claude.md](./claude.md); the visual system in [design.md](./design.md).

---

## Tech

| | |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind v4 (`@theme` tokens in `src/index.css`) |
| Server state | TanStack Query v5 + **Axios** (`src/api/axiosInstance.ts`, `withCredentials`) |
| Forms | react-hook-form + Zod |
| Icons | `@hugeicons/react` + `@hugeicons/core-free-icons` |
| Toasts | react-hot-toast (pill style) |
| Fonts | Space Grotesk (UI) + Plus Jakarta Sans (mono token) — self-hosted / Google Fonts |
| Own SDK | `@argusdev/sdk-react` (`workspace:*`) — `init()` + `<ArgusErrorBoundary>` in `main.tsx` |

---

## Structure

```
src/
├── api/axiosInstance.ts         # shared Axios instance + ApiError + oauthUrl (session cookie)
├── main.tsx                     # QueryClient + Toaster + Argus init() + <ArgusErrorBoundary>
├── App.tsx                      # routes
├── index.css                    # Tailwind v4 @theme tokens (design.md)
├── types/api.ts                 # server types: Issue, Event, Project, Usage, AlertRule, …
│
├── components/layout/
│   ├── AuthLayout.tsx           # centered card
│   ├── DashboardLayout.tsx      # sidebar + <Outlet>, session guard
│   └── RequireAuth.tsx          # gate for console/onboarding (no sidebar)
│
├── ui/                          # presentational primitives
│   ├── Button, Input, Eyebrow, Modal, LevelBadge, CopyButton
│   ├── Loader.tsx               # Loader / FullScreenLoader / PageLoader (spinning-ring logo)
│   ├── Sidebar.tsx              # grouped nav (Project / Organization) + Docs
│   └── ProjectSwitcher.tsx      # popover: quick-switch + "All projects"
│
├── hooks/                       # one file per resource (React Query + Axios)
│   ├── useAuth.ts               # useMe (returns user + organization), login/register/verifyOtp/logout
│   ├── useProjects.ts           # list, create, update, delete
│   ├── useIssues.ts             # list, counts, single, updateStatus, useFirstEvent (onboarding poll)
│   ├── useEvents.ts             # paginated events (stack-trace stepper)
│   ├── useUsage.ts              # GET /usage
│   ├── useAlerts.ts             # list + create/update/delete
│   └── useBilling.ts            # checkout + portal (redirect to Polar)
│
├── utils/                       # levels.ts (color meta), time.ts (relative timestamps)
└── features/
    ├── auth/                    # LoginPage, RegisterPage, VerifyOtpPage
    ├── projects/                # ProjectsConsolePage, OnboardingPage, components/NewProjectModal
    ├── issues/                  # IssuesPage, IssueDetailPage, components/{IssueRow,StackTrace,ContextPanel,StatusTabs}
    ├── settings/                # SettingsPage, components/InstallTabs (Browser/React/Node)
    ├── usage/                   # UsagePage (quota meter + level breakdown)
    ├── alerts/                  # AlertsPage, components/AlertRuleModal (both alert types)
    └── billing/                 # BillingPage (Free/Pro cards, Polar upgrade/manage)
```

---

## Routes

| Route | Page | Auth |
|---|---|---|
| `/login` `/register` `/verify` | auth | public (AuthLayout) |
| `/projects` | projects console | 🍪 (RequireAuth) |
| `/projects/:projectId/onboarding` | DSN reveal + waiting-for-first-event | 🍪 |
| `/projects/:projectId/issues` | issues list | 🍪 (DashboardLayout) |
| `/projects/:projectId/issues/:issueId` | issue detail (stack-trace stepper, resolve/ignore) | 🍪 |
| `/projects/:projectId/settings` | rename, DSN, install tabs, delete | 🍪 |
| `/projects/:projectId/usage` | quota meter + breakdown | 🍪 |
| `/projects/:projectId/alerts` | alert-rule CRUD (new-issue + error-rate) | 🍪 |
| `/projects/:projectId/billing` | plan cards, Polar upgrade / manage | 🍪 |
| `*` | → redirect to `/projects` | |

🍪 = session cookie. `DashboardLayout`/`RequireAuth` redirect to `/login` when `useMe` fails.

Nav items still `soon` (non-clickable): **Performance**, **Docs**.

---

## Conventions (see [claude.md](./claude.md))

- All server state through React Query hooks that call the shared `axiosInstance` — no raw fetch/axios in components.
- One hook file per resource in `src/hooks/`; presentational primitives in `ui/`; feature views in `features/`; pure helpers in `utils/`.
- Feedback via toasts; form-field errors inline.
- Design: dark-only, lime `#A3E635` accent, pills, `font-mono` for anything copyable.

---

## Environment

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_ARGUS_DSN=<a project DSN>   # dogfooding — dashboard reports its own crashes
```

---

## Running

```bash
pnpm dev:frontend           # from repo root → http://localhost:5173
pnpm --filter frontend build
```

---

## Status

Built ✅: auth, projects console + create + onboarding DSN reveal, issues list + detail, settings (rename/DSN/install-tabs/delete), usage meter, alerts CRUD, brand loader.
Planned 🔜: Performance dashboard (the only `soon` nav stub left).
