# Argus — Packages (SDKs)

Four npm packages developers install into their own apps to send errors and performance data to Argus.

---

## Overview

| Package            | Where it runs    | What it does                                     |
| ------------------ | ---------------- | ------------------------------------------------ |
| `sdk-core`         | Everywhere       | Shared utilities — all other SDKs depend on this |
| `sdk-browser`      | Web browsers     | Catches JS errors + web vitals                   |
| `sdk-node`         | Node.js backends | Catches uncaught exceptions + wraps Express      |
| `sdk-react-native` | Mobile apps (RN) | Catches JS crashes on iOS + Android              |

`sdk-core` is never installed directly by developers. It's an internal dependency of the other three.

---

## `sdk-core/`

```
sdk-core/
├── src/
│   ├── dsn.ts          # Parses DSN string → { host, projectId, publicKey }
│   ├── envelope.ts     # Builds + serialises the event envelope to JSON
│   ├── transport.ts    # fetch() with exponential backoff retry — sends envelope to ingest API
│   │                   # Silently drops event on 429 (quota exceeded) — never throws to the host app
│   ├── types.ts        # ArgusEvent, Breadcrumb, StackFrame, Envelope interfaces
│   └── index.ts        # Public exports
├── package.json
└── tsconfig.json
```

The DSN format:

```
https://PUBLIC_KEY@your-domain.com/PROJECT_ID
```

`dsn.ts` parses this into the three pieces every SDK needs: where to send events, which project to attach them to, and which key to authenticate with.

---

## `sdk-browser/`

```
sdk-browser/
├── src/
│   ├── init.ts         # Hooks window.onerror + window.onunhandledrejection
│   ├── breadcrumbs.ts  # Monkey-patches console, fetch, XHR, and click events to collect breadcrumbs
│   ├── vitals.ts       # Captures LCP, CLS, TTFB, FCP, FID via PerformanceObserver API
│   ├── types.ts
│   └── index.ts        # Public API: init(), captureException(), captureMessage()
├── package.json
└── tsconfig.json
```

**Usage:**

```ts
import { init, captureException } from "@argus/sdk-browser";

init({ dsn: "https://PUBLIC_KEY@your-domain.com/PROJECT_ID" });

// Manual capture — uncaught errors are captured automatically
try {
  doSomething();
} catch (err) {
  captureException(err);
}
```

---

## `sdk-node/`

```
sdk-node/
├── src/
│   ├── init.ts                     # Hooks process.on('uncaughtException') + process.on('unhandledRejection')
│   ├── integrations/
│   │   ├── express.ts              # Express error handler middleware
│   │   └── http.ts                 # Traces outgoing HTTP requests via AsyncLocalStorage
│   ├── types.ts
│   └── index.ts                    # Public API: init(), captureException(), argusErrorHandler()
├── package.json
└── tsconfig.json
```

**Usage:**

```ts
import { init, argusErrorHandler } from "@argus/sdk-node";

init({ dsn: "https://PUBLIC_KEY@your-domain.com/PROJECT_ID" });

// Must be after all routes, before any other error handlers
app.use(argusErrorHandler());
```

---

## `sdk-react-native/`

```
sdk-react-native/
├── src/
│   ├── init.ts             # Sets ErrorUtils.setGlobalHandler, catches unhandled Promise rejections
│   ├── errorHandler.ts     # Formats React Native stack traces into Argus StackFrame shape
│   ├── types.ts
│   └── index.ts            # Public API: init(), captureException()
├── package.json
└── tsconfig.json
```

**Usage:**

```ts
import { init } from "@argus/sdk-react-native";

// Call at the top of index.js before everything else
init({ dsn: "https://PUBLIC_KEY@your-domain.com/PROJECT_ID" });
```

---

## How They Connect

```
sdk-browser / sdk-node / sdk-react-native
        │
        │  imports
        ▼
    sdk-core
        │
        │  POST /ingest/:projectId/envelope
        ▼
   Argus ingest API
        │
        ├─ 200 OK       → event queued, will be processed
        ├─ 401          → invalid DSN key
        └─ 429          → quota exceeded (FREE plan limit hit), event silently dropped
```

The SDKs never throw or surface errors to the host app — they fail silently. A `429` from a quota breach is logged to the browser/Node console at most.

---

## Running Locally

```bash
# Build all packages
pnpm --filter sdk-core build
pnpm --filter sdk-browser build
pnpm --filter sdk-node build
pnpm --filter sdk-react-native build

# Or build everything from root
pnpm build
```

To test against your local Argus instance set the DSN host to localhost:

```
https://YOUR_PUBLIC_KEY@localhost:3001/YOUR_PROJECT_ID
```
