# @argusdev/sdk-nextjs

Next.js SDK for [Argus](https://github.com/oluwatobicode/argus). Covers **both runtimes** — client components via `@argusdev/sdk-browser`, and server components / route handlers / server actions / middleware via Next's `onRequestError` hook.

## Install

```bash
npm install @argusdev/sdk-nextjs
```

## Why not just `@argusdev/sdk-react`

It only sees half a Next app, and breaks the other half:

- **Coverage.** `sdk-react` is `sdk-browser` + a boundary. Server components, route handlers, server actions, and middleware never touch `window.onerror` or a React boundary. `sdk-node` doesn't help either — Next catches request errors and renders its error page, so they never become an `uncaughtException`.
- **SSR.** Calling the browser `init()` during a server render used to throw `ReferenceError: window is not defined` — an error tracker crashing the app it monitors. That's now fixed at the source in `sdk-browser` (it no-ops without a `window`), but the coverage gap above is structural and still needs this package.

## Two entry points

Next runs two runtimes from one module graph, so the entry point is explicit rather than guessed. Importing the wrong half is the most common way to break a Next build; separate subpaths make that impossible instead of merely unlikely.

| Import                        | Use in                                             |
| ----------------------------- | -------------------------------------------------- |
| `@argusdev/sdk-nextjs/server` | `instrumentation.ts`                               |
| `@argusdev/sdk-nextjs/client` | client components, `error.tsx`, `global-error.tsx` |
| `@argusdev/sdk-nextjs`        | types only, no runtime                             |

## Server

```ts
// instrumentation.ts
import {
  init,
  onRequestError as argusOnRequestError,
} from "@argusdev/sdk-nextjs/server";

export function register() {
  init({
    dsn: process.env.ARGUS_DSN!,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}

export const onRequestError = argusOnRequestError;
```

That single export covers server components, route handlers, server actions, and middleware. It's typed to satisfy Next's own `Instrumentation.onRequestError`, so this also typechecks:

```ts
import type { Instrumentation } from "next";
export const onRequestError: Instrumentation.onRequestError = argusOnRequestError;
```

It returns a promise and Next awaits it — which matters on serverless, where the function can freeze the moment the response is sent and drop an in-flight request.

Tags attached automatically:

| Tag                | Example                                      |
| ------------------ | -------------------------------------------- |
| `routePath`        | `/blog/[slug]`                               |
| `routerKind`       | `App Router`                                 |
| `routeType`        | `render` / `route` / `action` / `middleware` |
| `renderSource`     | `react-server-components`                    |
| `revalidateReason` | `on-demand` / `stale`                        |
| `digest`           | `3163989896`                                 |

`routePath` is the dynamic **pattern**, not the resolved URL, so it stays stable across requests — the tag worth filtering the dashboard by.

Manual capture anywhere on the server:

```ts
import { captureException } from "@argusdev/sdk-nextjs/server";

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    await captureException(err, { tags: { routePath: "/api/checkout" } });
    throw err;
  }
}
```

### Headers are not forwarded

Only `user-agent` is sent. Cookies and `authorization` live in the same object and are never copied into an envelope. A repeated header arrives from Next as an array (`NodeJS.Dict<string | string[]>`) and is narrowed to its first value.

### Edge runtime

Works as-is. The server entry uses no Node built-ins — no `process`, no `node:*` — and `sdk-core`'s transport is `fetch` + `setTimeout`. It also never imports `sdk-browser`, so no browser code lands in a server or edge bundle.

## Client

Init once, in a client component or `instrumentation-client.ts` (Next 15.3+):

```ts
import { init } from "@argusdev/sdk-nextjs/client";

init({ dsn: process.env.NEXT_PUBLIC_ARGUS_DSN! });
```

Then report what Next's error boundaries catch:

```tsx
// app/error.tsx
"use client";
import { useArgusError } from "@argusdev/sdk-nextjs/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useArgusError(error);
  return <button onClick={reset}>Try again</button>;
}
```

Same for `app/global-error.tsx`. The hook is keyed on the error object, so a re-render doesn't re-report the same crash but a genuinely new one still gets through. `captureError(error)` is the non-hook form.

**The `digest` is the join key.** Next stamps a digest on a server error and surfaces the *same* digest to the client's `error.tsx`. Both halves tag it, so a single failure is searchable across the server envelope and the client one.

## Version support

| Next    | Client | Server                                                   |
| ------- | ------ | -------------------------------------------------------- |
| 15+     | ✅      | ✅ `onRequestError`                                       |
| 13 / 14 | ✅      | ❌ — no `onRequestError`; use manual `captureException()` |

Verified against Next 15.5. `next` is not a dependency — the handler is typed structurally, so any 15.x shape works.

MIT © Treasure Odetokun
