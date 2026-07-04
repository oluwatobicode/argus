# @argusdev/sdk-react

React SDK for [Argus](https://github.com/oluwatobicode/argus) — an error boundary on top of `@argusdev/sdk-browser`. Catches render crashes that `window.onerror` misses.

## Install

```bash
npm install @argusdev/sdk-react
```

## Usage

```tsx
import { init, ArgusErrorBoundary } from "@argusdev/sdk-react";

init({ dsn: "https://<publicKey>@<host>/<projectId>" });

function Root() {
  return (
    <ArgusErrorBoundary fallback={<p>Something went wrong.</p>}>
      <App />
    </ArgusErrorBoundary>
  );
}
```

`init()` sets up the same global handlers as `@argusdev/sdk-browser` (so you only need one import), and the boundary reports React render errors with the crashing component.

MIT © Treasure Odetokun
