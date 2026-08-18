# @argusdev/sdk-node

Node.js SDK for [Argus](https://github.com/oluwatobicode/argus) — captures uncaught exceptions and unhandled rejections, with an optional Express error handler. Every event ships with **source context**: the actual code lines around the crash, read at capture time.

## Install

```bash
npm install @argusdev/sdk-node
```

## Usage

```ts
import { init } from "@argusdev/sdk-node";

init({ dsn: "https://<publicKey>@<host>/<projectId>", environment: "production" });
```

`process.on("uncaughtException")` and `process.on("unhandledRejection")` are wired automatically. On an uncaught exception the event is sent, then the process exits `1` (crash behavior preserved).

### Express

Add the error handler **after your routes**, before your own:

```ts
import { argusErrorHandler } from "@argusdev/sdk-node";

app.use(argusErrorHandler());
```

It captures the error with request context, then passes it along — it observes, never absorbs.

## Source context (v0.4+)

On a server, the crashing source sits on the same disk — so at capture time the SDK reads the ±5 lines around each in-app stack frame and attaches them to the event. The Argus dashboard renders the snippet with the crashing line highlighted:

```text
applyDiscount in /app/dist/services/checkout.js:3:27
   1  export function applyDiscount(cart, coupon) {
   2    // expired coupons come back undefined
 ▌ 3    const discount = coupon.percentOff / 100;   ← the crash
   4    const subtotal = cart.items.reduce(…)
   5    return subtotal * (1 - discount);
```

No source maps, no build step, no configuration. In-app frames only (`node_modules` and `node:` internals are skipped), lines clipped to 200 chars, at most 10 frames per event, and any read failure silently degrades to "no snippet" — context reading can never break error reporting.

One thing to know: the lines around a crash site travel inside the event, exactly like Sentry's equivalent feature — if a secret is hardcoded next to a crashing line, it ships too. Keep secrets in env vars, not source.

MIT © Treasure Odetokun
