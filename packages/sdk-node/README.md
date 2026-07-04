# @argusdev/sdk-node

Node.js SDK for [Argus](https://github.com/oluwatobicode/argus) — captures uncaught exceptions and unhandled rejections, with an optional Express error handler.

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

MIT © Treasure Odetokun
