# Argus — Packages (SDKs)

Seven TypeScript packages, zero runtime dependencies outside the scope itself. **Published to npm under the `@argusdev/*` scope** (public; **v0.3.0** — SSR safety, the Node-ESM fix, and the vue/angular/nextjs debuts). Linked inside the monorepo via `workspace:*` — publish with `pnpm publish`, never `npm publish` (only pnpm rewrites the workspace protocol).

Every SDK follows the same 3-part pattern: **hook** (how this runtime announces crashes) → **normalize** (that runtime's error format → a real `Error` + `StackFrame[]`) → **delegate** (sdk-core builds + sends the envelope).

---

## Overview

| Package       | Where it runs    | Status | What it does                                                |
| ------------- | ---------------- | ------ | ----------------------------------------------------------- |
| `sdk-core`    | Everywhere       | ✅     | DSN parsing, envelope builder, transport — shared internals |
| `sdk-node`    | Node.js backends | ✅     | uncaughtException/unhandledRejection + Express middleware   |
| `sdk-browser` | Web browsers     | ✅     | window.onerror, unhandledrejection, Chrome+Firefox parsing  |
| `sdk-react`   | React apps       | ✅     | `<ArgusErrorBoundary>` on top of sdk-browser                |
| `sdk-vue`     | Vue 3 apps       | ✅     | `argusVue` plugin → `app.config.errorHandler`               |
| `sdk-angular` | Angular apps     | ✅     | `ArgusErrorHandler` provider + Angular wrapper unwrapping   |
| `sdk-nextjs`  | Next.js apps     | ✅     | `/client` + `/server` (`onRequestError`) — both runtimes    |

`sdk-core` is never installed directly by developers — it's an internal dependency of the other six.

**Framework deps:** `sdk-react` peer-depends on `react >=18`, `sdk-vue` on `vue >=3`, `sdk-nextjs` on `react >=18` (types only). Neither `sdk-angular` nor `sdk-nextjs` imports its framework at all — both hook in structurally. See their READMEs.

**SSR:** `sdk-browser`'s `init()` and `captureException()` no-op instead of throwing when there is no `window`, so react/vue/angular/nextjs are all safe to import into a server render. Manual `captureException()` still reports from the server — Node's stack format is V8, which `parseStack` already handles.

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
```

**Usage:**

```ts
import { init, argusErrorHandler } from "@argusdev/sdk-node";

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
import { init, captureException } from "@argusdev/sdk-browser";

init({ dsn: "http(s)://KEY@host/PROJECT_ID" });

// manual capture — uncaught errors are automatic
try { doSomething(); } catch (err) { captureException(err); }
```

Every event auto-attaches `request.url = window.location.href` when there is a `window`. The same error thrown in Chrome and Firefox parses to identical frames → identical fingerprint → one Issue, not one per browser.

**SSR-safe:** `init()` returns early and `captureException()` skips the page URL when `window` is undefined, so importing this (or react/vue/angular/nextjs on top of it) into a server render no longer throws. `client` is still set, so a manual `captureException()` reports from the server.

**Web vitals (v0.2+):** every page view reports a `page.load` transaction with LCP, CLS, FCP, TTFB — buffered `PerformanceObserver`s, one send on page hide (`keepalive`). On by default; `init({ vitals: false })` opts out.

Planned (not built): breadcrumbs (console/click/fetch trail).

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
import { init, ArgusErrorBoundary } from "@argusdev/sdk-react";

init({ dsn: "http(s)://KEY@host/PROJECT_ID" });

<ArgusErrorBoundary fallback={<p>Something went wrong</p>}>
  <App />
</ArgusErrorBoundary>
```

Why a boundary: React render crashes don't reach `window.onerror` in production builds — `componentDidCatch` is the only reliable hook. The crashing component (first line of `componentStack`) is attached as a tag.

---

## `sdk-vue/`

```
sdk-vue/
├── src/
│   ├── plugin.ts       # argusVue plugin + attachVueErrorHandler(app)
│   └── index.ts        # re-exports init from sdk-browser: one import for Vue users
```

**Usage:**

```ts
import { createApp } from "vue";
import { argusVue } from "@argusdev/sdk-vue";

createApp(App)
  .use(argusVue, { dsn: "http(s)://KEY@host/PROJECT_ID" })
  .mount("#app");
```

Same reason as React: Vue catches render/`setup()`/lifecycle/watcher/event-handler errors and routes them to `app.config.errorHandler` without re-throwing, so `window.onerror` never sees them. Two tags come free — `component` (from the SFC's `__name`) and `lifecycleHook` (Vue's own label, e.g. `"render function"`).

A pre-existing `errorHandler` is chained, not replaced; if there was none, Vue's `console.error` is preserved.

---

## `sdk-angular/`

```
sdk-angular/
├── src/
│   ├── normalize.ts      # unwrap Angular's wrappers → a real Error + http tags
│   ├── error-handler.ts  # class ArgusErrorHandler — the ErrorHandler provider
│   └── index.ts          # re-exports init from sdk-browser
```

**Usage:**

```ts
import { ErrorHandler } from "@angular/core";
import { init, ArgusErrorHandler } from "@argusdev/sdk-angular";

init({ dsn: "http(s)://KEY@host/PROJECT_ID" });

bootstrapApplication(AppComponent, {
  providers: [{ provide: ErrorHandler, useClass: ArgusErrorHandler }],
});
```

The interesting part is **normalize**. Angular rarely hands `ErrorHandler` a plain `Error` — it hands over `{ rejection }` (zone.js), `error.ngOriginalError` (Angular rethrows), or an `HttpErrorResponse`, which is Error-*shaped* but not an `instanceof Error`. Untreated, all three stringify to `[object Object]` and fold into one useless Issue. `normalizeAngularError()` walks that chain (max 4 deep), pulls out the innermost real error, and keeps `httpStatus` + `httpUrl` as tags.

When it has to synthesize an `Error` (nothing real underneath), it also **replaces the synthesized stack**: `new Error()` would otherwise capture Argus's own frames, which are identical for every such error — and since the worker fingerprints on frames alone (`filename:function:lineno`, top 5), that would group every failed HTTP call in the app into a single Issue. Instead one synthetic frame carries the identity (`filename` = request URL, `lineno` = status), so grouping lands per endpoint + status.

No `@angular/core` dependency: `ArgusErrorHandler` is structurally assignable to Angular's `ErrorHandler`, and has a zero-arg constructor so `useClass` works without `@Injectable()`.

---

## `sdk-nextjs/`

```
sdk-nextjs/
├── src/
│   ├── client.ts       # "use client" — init, captureError, useArgusError (error.tsx)
│   ├── server.ts       # init + onRequestError for instrumentation.ts
│   ├── stacktrace.ts   # V8-only parser — keeps sdk-browser out of server bundles
│   └── index.ts        # types only, no runtime
```

Two explicit subpaths — `@argusdev/sdk-nextjs/client` and `/server` — because Next runs two runtimes from one module graph and importing the wrong half is the standard way to break a build.

**Server** covers what no other SDK can reach. Server components, route handlers, server actions, and middleware never touch `window.onerror` or a React boundary, and `sdk-node` doesn't see them either — Next catches request errors and renders its error page, so they never become an `uncaughtException`. Next's `onRequestError` hook is the only way in:

```ts
// instrumentation.ts
import { init, onRequestError as argusOnRequestError } from "@argusdev/sdk-nextjs/server";

export function register() {
  init({ dsn: process.env.ARGUS_DSN! });
}
export const onRequestError = argusOnRequestError;
```

Auto-tags `routePath` (the dynamic **pattern**, `/blog/[slug]` — stable across requests, so it's the one worth filtering by), `routerKind`, `routeType`, `renderSource`, `revalidateReason`, and Next's `digest`. Headers are **not** forwarded except `user-agent` — cookies and `authorization` sit in the same object.

**Client** re-exports the browser `init` plus `useArgusError(error)` for `error.tsx` / `global-error.tsx`. Both halves tag the `digest`, which is the same value on server and client, so one failure is searchable across both envelopes.

Edge-safe: the server entry uses no Node built-ins and never imports `sdk-browser`.

---

## How They Connect

```
sdk-node / sdk-browser / sdk-react / sdk-vue / sdk-angular / sdk-nextjs
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
pnpm --filter @argusdev/sdk-core build      # required once before typechecking dependents
pnpm --filter "@argusdev/sdk-*" exec tsc --noEmit
pnpm --filter "@argusdev/sdk-*" build       # build all seven (topological order)
pnpm test:sdk                               # from repo root: build + run every SDK test suite
pnpm --filter @argusdev/sdk-core test       # one package's tests
```

**Relative imports must carry a `.js` extension** (`from "./plugin.js"`). TypeScript resolves it back to `plugin.ts` and bundlers don't care, but without it the emitted ESM is unloadable by plain Node — `ERR_MODULE_NOT_FOUND`. A regression test in `tests/` scans every dist for this.

## Tests

Every package has a `node:test` suite (zero test dependencies) under `test/`, running against the **built dist** — so build first, or use `pnpm test:sdk`, which does both. Two layers:

- **Per-package units** — transport retry matrix (mocked timers), dual-format stack parsing, handler chaining, SSR behavior (own process, no `window`), vitals capture/report, Angular unwrapping, Next tag mapping + secret-scrubbing. `sdk-node`'s uncaughtException test spawns a real subprocess against a real HTTP server and asserts the envelope arrives *and* the process exits 1.
- **`tests/` (private `@argusdev/sdk-tests`)** — cross-SDK integration: every package's emitted envelope is validated against the API's **real** Zod ingest schema, and grouping against the worker's **real** `computeFingerprint` (both imported straight from `app/backend` via Node type-stripping — no mirrored copies to drift).

To test the full pipeline, create a project in the dashboard, install an SDK
(`npm install @argusdev/sdk-browser`), and call `init({ dsn })`.

---

## Build Phases

- [x] `@argusdev/sdk-core` — DSN parsing, envelope builder, transport with retry
- [x] `@argusdev/sdk-node` — uncaughtException, unhandledRejection, Express error middleware
- [x] `@argusdev/sdk-browser` — window.onerror, unhandledrejection, dual-format stack parsing
- [x] `@argusdev/sdk-react` — ErrorBoundary
- [x] Published to npm (`@argusdev` scope, public)
- [x] Browser SDK web vitals + page.load transactions (v0.2.0)
- [x] `@argusdev/sdk-vue` — app-level errorHandler plugin
- [x] `@argusdev/sdk-angular` — ErrorHandler provider + wrapper unwrapping
- [x] `@argusdev/sdk-nextjs` — client + server (`onRequestError`) entries
- [x] SSR safety in `sdk-browser` (no more `window is not defined` on server renders)
- [x] `node:test` suites across all seven + `tests/` integration package (real validator + real fingerprint)
- [x] **v0.3.0 published** (2026-08-15) — all seven live; install verified from the registry end-to-end
- [ ] Deprecate `@argusdev/sdk-node@<=0.2.1` on npm (broken ESM — unloadable in Node)
- [ ] Browser SDK breadcrumbs
- [ ] `@argusdev/sdk-react-native`, Svelte, Go
- [ ] `@argusdev/sdk-java` (dir exists, empty — separate Maven toolchain, no code sharing with sdk-core)
