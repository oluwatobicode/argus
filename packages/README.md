# Argus — Packages (SDKs)

Four TypeScript packages, zero runtime dependencies. Not yet published to npm — usable today inside the monorepo via `workspace:*`.

Every SDK follows the same 3-part pattern: **hook** (how this runtime announces crashes) → **normalize** (that runtime's stack format → `StackFrame[]`) → **delegate** (sdk-core builds + sends the envelope).

---

## Overview

| Package       | Where it runs    | Status | What it does                                                |
| ------------- | ---------------- | ------ | ----------------------------------------------------------- |
| `sdk-core`    | Everywhere       | ✅     | DSN parsing, envelope builder, transport — shared internals |
| `sdk-node`    | Node.js backends | ✅     | uncaughtException/unhandledRejection + Express middleware   |
| `sdk-browser` | Web browsers     | ✅     | window.onerror, unhandledrejection, Chrome+Firefox parsing  |
| `sdk-react`   | React apps       | ✅     | `<ArgusErrorBoundary>` on top of sdk-browser                |

`sdk-core` is never installed directly by developers — it's an internal dependency of the other three.

---

## `sdk-core/`

```
sdk-core/
├── src/
│   ├── dsn.ts          # parseDsn() → { publicKey, host, projectId, protocol }; getIngestUrl()
│   ├── envelope.ts     # buildEnvelope() — pure function, stamps timestamp: Date.now() (ms contract)
│   ├── transport.ts    # sendEnvelope() — fetch + retry/backoff; drops on 429; NEVER throws
│   ├── types.ts        # Envelope, StackFrame, ExceptionPayload, Breadcrumb
│   └── index.ts        # public exports
└── scripts/smoke.mts   # npx tsx packages/sdk-core/scripts/smoke.mts "<dsn>"
```

DSN format (path segment is the project **id**, matching the ingest route):

```
http(s)://PUBLIC_KEY@your-domain.com/PROJECT_ID
```

Transport rules: `429` (quota/rate limit) → drop silently, no retry. Other `4xx` → warn once, no retry. `5xx`/network → retry ×2 with exponential backoff. Nothing ever throws into the host app.

---

## `sdk-node/`

```
sdk-node/
├── src/
│   ├── init.ts         # init() + captureException(); hooks process.on(...)
│   ├── stacktrace.ts   # V8 "at fn (file:line:col)" parser → StackFrame[]
│   ├── express.ts      # argusErrorHandler() middleware (no dependency on express itself)
│   └── index.ts
└── scripts/smoke.mts   # crashes a fake app on purpose — run from repo root
```

**Usage:**

```ts
import { init, argusErrorHandler } from "@argus/sdk-node";

init({ dsn: "http://KEY@localhost:3000/PROJECT_ID", environment: "production" });

// Express apps — after all routes, before your own error handler:
app.use(argusErrorHandler());
```

Behavior: on `uncaughtException` the event is sent, then the process exits `1` (crash behavior preserved). `unhandledRejection` is captured without exiting. Non-Error rejections are normalized.

---

## `sdk-browser/`

```
sdk-browser/
├── src/
│   ├── init.ts         # window.onerror (chains pre-existing handlers) + unhandledrejection
│   ├── stacktrace.ts   # Chrome "at fn (url:l:c)" AND Firefox/Safari "fn@url:l:c" → StackFrame[]
│   └── index.ts        # init(), captureException()
```

**Usage:**

```ts
import { init, captureException } from "@argus/sdk-browser";

init({ dsn: "http(s)://KEY@host/PROJECT_ID" });

// manual capture — uncaught errors are automatic
try { doSomething(); } catch (err) { captureException(err); }
```

Every event auto-attaches `request.url = window.location.href`. The same error thrown in Chrome and Firefox parses to identical frames → identical fingerprint → one Issue, not one per browser.

Planned (not built): breadcrumbs (console/click/fetch trail), web vitals.

---

## `sdk-react/`

```
sdk-react/
├── src/
│   ├── ErrorBoundary.tsx  # <ArgusErrorBoundary> — componentDidCatch → captureException
│   └── index.ts           # re-exports init from sdk-browser: one import for React users
```

**Usage:**

```tsx
import { init, ArgusErrorBoundary } from "@argus/sdk-react";

init({ dsn: "http(s)://KEY@host/PROJECT_ID" });

<ArgusErrorBoundary fallback={<p>Something went wrong</p>}>
  <App />
</ArgusErrorBoundary>
```

Why a boundary: React render crashes don't reach `window.onerror` in production builds — `componentDidCatch` is the only reliable hook. The crashing component (first line of `componentStack`) is attached as a tag.

---

## How They Connect

```
sdk-node / sdk-browser / sdk-react
        │  imports
        ▼
    sdk-core
        │  POST /api/v1/ingest/:projectId/envelope
        ▼
   Argus ingest API
        ├─ 200 → queued → worker → Issue
        ├─ 400 → invalid envelope (Zod details in response)
        ├─ 401 → invalid DSN key
        └─ 429 → quota/rate limit — SDK drops silently
```

**Envelope contract:** all timestamps are **milliseconds** since epoch (`Date.now()`). Enforced by the API's validator — a seconds value is rejected loudly. See AGENTS.md.

---

## Developing Locally

```bash
pnpm --filter @argus/sdk-core build      # required once before typechecking dependents
pnpm --filter "@argus/sdk-*" exec tsc --noEmit

# end-to-end smoke tests (API + worker must be running):
npx tsx packages/sdk-core/scripts/smoke.mts "<dsn>"
npx tsx packages/sdk-node/scripts/smoke.mts "<dsn>"
```

---

## Build Phases

- [x] `@argus/sdk-core` — DSN parsing, envelope builder, transport with retry
- [x] `@argus/sdk-node` — uncaughtException, unhandledRejection, Express error middleware
- [x] `@argus/sdk-browser` — window.onerror, unhandledrejection, dual-format stack parsing
- [x] `@argus/sdk-react` — ErrorBoundary
- [ ] Browser SDK breadcrumbs + web vitals
- [ ] Publish to npm (scope TBD — `@argus` likely taken)
- [ ] `@argus/sdk-react-native`, Vue, Go
