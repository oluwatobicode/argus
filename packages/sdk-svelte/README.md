# @argusdev/sdk-svelte

SvelteKit SDK for [Argus](https://github.com/oluwatobicode/argus) — `handleError` wrappers for both hooks files, on top of `@argusdev/sdk-browser`. SvelteKit routes every unexpected error through `handleError`; they never reach `window.onerror` or process handlers.

## Install

```bash
npm install @argusdev/sdk-svelte
```

## Usage

```ts
// hooks.server.ts
import { init, handleErrorWithArgus } from "@argusdev/sdk-svelte/server";

init({ dsn: "https://<publicKey>@<host>/<projectId>", environment: "production" });

export const handleError = handleErrorWithArgus();
```

```ts
// hooks.client.ts
import { init, handleErrorWithArgus } from "@argusdev/sdk-svelte/client";

init({ dsn: "https://<publicKey>@<host>/<projectId>" });

export const handleError = handleErrorWithArgus();
```

The client `init()` also gives you `window.onerror`, unhandled rejections, and web vitals — the wrapper covers what SvelteKit swallows (`load` failures, navigation errors, form actions, endpoints, rendering).

## Keeping your own handleError

Pass it in — it still runs, and its return value (the shape `$page.error` gets) is preserved:

```ts
export const handleError = handleErrorWithArgus(({ error, event }) => {
  return { message: "Whoops!" };
});
```

Both wrappers satisfy SvelteKit's own `HandleServerError` / `HandleClientError` types:

```ts
import type { HandleServerError } from "@sveltejs/kit";
export const handleError: HandleServerError = handleErrorWithArgus();
```

## What gets attached

| Tag                | Example          |
| ------------------ | ---------------- |
| `routeId`          | `/blog/[slug]`   |
| `status`           | `500`            |
| `sveltekitMessage` | `Internal Error` |

`routeId` is the dynamic **pattern**, stable across requests — the tag worth filtering the dashboard by. Server events also carry `request` context (pathname, method, `user-agent`). Cookies and `authorization` are never forwarded.

**404s are skipped** — unmatched routes reach `handleError` too, and they're traffic noise, not crashes. Your own handler still runs for them.

## Two entry points

| Import                        | Use in            |
| ----------------------------- | ----------------- |
| `@argusdev/sdk-svelte/server` | `hooks.server.ts` |
| `@argusdev/sdk-svelte/client` | `hooks.client.ts` |

The server entry never imports `sdk-browser` and uses no Node built-ins — it runs on edge deployments as-is. No `@sveltejs/kit` dependency: the wrappers are typed structurally, so any Kit 2.x works.

MIT © Treasure Odetokun
