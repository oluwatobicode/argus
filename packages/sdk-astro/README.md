# @argusdev/sdk-astro

Astro SDK for [Argus](https://github.com/oluwatobicode/argus) — one integration wires **both runtimes**: browser capture (errors + web vitals) on every page, and SSR error capture in middleware.

## Install

```bash
npm install @argusdev/sdk-astro
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import argus from "@argusdev/sdk-astro";

export default defineConfig({
  integrations: [
    argus({ dsn: "https://<publicKey>@<host>/<projectId>", environment: "production" }),
  ],
});
```

That one line does three things at `astro:config:setup`:

1. **Injects a page script** — the browser SDK's `init()` on every page: `window.onerror`, unhandled rejections, web vitals (`vitals: false` opts out).
2. **Adds server middleware** (`order: "pre"`) — wraps the request pipeline, captures SSR errors (frontmatter, endpoints, server islands), and **rethrows untouched** so Astro still renders its error page and dev overlay.
3. **Compiles your DSN into the middleware** via vite `define` — no config files, no env-var contract.

## Options

| Option        | Default    | What                                          |
| ------------- | ---------- | --------------------------------------------- |
| `dsn`         | _required_ | `https://KEY@host/PROJECT_ID`                 |
| `environment` | —          | e.g. `"production"`                           |
| `release`     | —          | version string, for regression tracking       |
| `vitals`      | `true`     | `page.load` transaction with LCP/CLS/FCP/TTFB |

## What server events carry

| Tag / field    | Example         |
| -------------- | --------------- |
| `routePattern` | `/blog/[slug]`  |
| `request.url`  | `/blog/hello`   |
| `request.method` | `GET`         |

`routePattern` (Astro 5+) is the dynamic **pattern**, stable across requests — the tag worth filtering by. Only `user-agent` is forwarded from headers; cookies and `authorization` never are.

## Manual capture

```ts
import { captureException } from "@argusdev/sdk-astro/client";

try {
  await checkout();
} catch (err) {
  captureException(err);
}
```

## Notes

- **No `astro` dependency** — the integration and middleware are typed structurally and satisfy Astro's own `AstroIntegration` / `MiddlewareHandler` types (verified against Astro 5).
- The middleware entry uses no Node built-ins and never imports `sdk-browser`, so it runs on edge adapters as-is.
- The injected page script imports from `@argusdev/sdk-astro/client` (the package you installed) rather than a transitive dep — it resolves under pnpm's strict `node_modules` layout too.

MIT © Treasure Odetokun
