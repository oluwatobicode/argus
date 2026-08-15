# @argusdev/sdk-vue

Vue 3 SDK for [Argus](https://github.com/oluwatobicode/argus) — an app-level error handler on top of `@argusdev/sdk-browser`. Catches component errors that `window.onerror` never sees.

## Install

```bash
npm install @argusdev/sdk-vue
```

## Usage

```ts
import { createApp } from "vue";
import { argusVue } from "@argusdev/sdk-vue";
import App from "./App.vue";

createApp(App)
  .use(argusVue, { dsn: "https://<publicKey>@<host>/<projectId>" })
  .mount("#app");
```

The plugin does two things: it calls the browser SDK's `init()` (so you get `window.onerror`, unhandled rejections, and web vitals for free) and installs `app.config.errorHandler`.

Manual capture works the same as everywhere else:

```ts
import { captureException } from "@argusdev/sdk-vue";

try {
  await save();
} catch (err) {
  captureException(err);
}
```

## Options

Same as `@argusdev/sdk-browser`:

| Option        | Default    | What                                             |
| ------------- | ---------- | ------------------------------------------------ |
| `dsn`         | _required_ | `https://KEY@host/PROJECT_ID`                    |
| `environment` | —          | e.g. `"production"`                              |
| `release`     | —          | version string, for regression tracking          |
| `vitals`      | `true`     | `page.load` transaction with LCP/CLS/FCP/TTFB    |

## Why a plugin and not just `init()`

Vue catches errors thrown in render functions, `setup()`, lifecycle hooks, watchers, and event handlers, then routes them to `app.config.errorHandler`. They are never re-thrown, so `window.onerror` stays silent — exactly the reason the React SDK needs an error boundary.

Two tags come along for free:

- `component` — the crashing component's name (`__name` from the SFC filename, or an explicit `name`)
- `lifecycleHook` — Vue's own label for where it blew up: `"render function"`, `"setup function"`, `"native event handler"`, `"watcher callback"`…

Already have an `errorHandler`? It's chained, not replaced. If you had none, Vue's `console.error` is preserved so the error still shows up in devtools.

## Already call `init()` yourself?

Attach just the Vue hook:

```ts
import { init, attachVueErrorHandler } from "@argusdev/sdk-vue";

init({ dsn });
const app = createApp(App);
attachVueErrorHandler(app);
```

## Note on `errorCaptured`

A component-level `errorCaptured` hook that returns `false` stops propagation — the error never reaches `app.config.errorHandler`, so Argus never sees it. Return nothing (or `true`) if you want it reported.

MIT © Treasure Odetokun
