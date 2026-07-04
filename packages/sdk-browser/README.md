# @argusdev/sdk-browser

Browser SDK for [Argus](https://github.com/oluwatobicode/argus) — captures uncaught errors and unhandled promise rejections and reports them to your Argus project.

## Install

```bash
npm install @argusdev/sdk-browser
```

## Usage

```ts
import { init } from "@argusdev/sdk-browser";

init({ dsn: "https://<publicKey>@<host>/<projectId>" });
```

That's it — `window.onerror` and `unhandledrejection` are captured automatically. Each event includes the current page URL.

Capture something manually:

```ts
import { captureException } from "@argusdev/sdk-browser";

try {
  doSomething();
} catch (err) {
  captureException(err);
}
```

Handles both Chrome and Firefox/Safari stack formats. Using React? Install `@argusdev/sdk-react` for an error boundary.

MIT © Treasure Odetokun
