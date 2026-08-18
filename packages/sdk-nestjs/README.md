# @argusdev/sdk-nestjs

NestJS SDK for [Argus](https://github.com/oluwatobicode/argus) — a global exception filter on top of `@argusdev/sdk-node`. Nest resolves every route error to a response itself, so process-level handlers never see them; a filter is the only reliable hook.

## Install

```bash
npm install @argusdev/sdk-nestjs
```

## Usage

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { init, ArgusExceptionFilter } from "@argusdev/sdk-nestjs";
import { AppModule } from "./app.module";

init({ dsn: process.env.ARGUS_DSN!, environment: "production" });

const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new ArgusExceptionFilter());
await app.listen(3000);
```

Works with both the **Express and Fastify** adapters. `init()` is `@argusdev/sdk-node`'s — it also hooks `uncaughtException`/`unhandledRejection`, so errors outside the request cycle (startup, timers, queues) are reported too.

## What gets reported — and what doesn't

| Thrown                                   | Captured | Response                        |
| ---------------------------------------- | -------- | ------------------------------- |
| plain `Error` (the bug)                  | ✅       | Nest's default 500 body         |
| `HttpException` with status ≥ 500        | ✅       | the exception's own status/body |
| `HttpException` 4xx (`NotFoundException`, validation 400s…) | ❌ | the exception's own status/body |

4xx `HttpException`s are control flow, not crashes — capturing every 404 and validation error would bury real Issues in noise. Captured events carry `httpStatus`, method, URL, and `user-agent` (cookies and `authorization` are never forwarded), and captured errors are re-logged to the console — we observe, never absorb.

The filter owns the response (that's what a Nest filter is), so it reproduces Nest's default behavior exactly — verified against a real Nest 11 app: clients see byte-identical responses.

## No `@nestjs/*` dependency

`ArgusExceptionFilter` has no `@Catch()` decorator and imports nothing from Nest. Nest reads catch-scope metadata off the instance; with none present the filter is catch-all — exactly what a global reporter wants. It's structurally assignable to Nest's `ExceptionFilter`:

```ts
import type { ExceptionFilter } from "@nestjs/common";
const filter: ExceptionFilter = new ArgusExceptionFilter();
```

`HttpException` is detected by shape (`getStatus`/`getResponse`), not `instanceof` — so duplicate `@nestjs/common` copies in one `node_modules` can't break detection.

Manual capture anywhere:

```ts
import { captureException } from "@argusdev/sdk-nestjs";

await captureException(err, { tags: { job: "invoice-sync" } });
```

## Source context (v0.4+)

Every captured event ships with the ±5 source lines around each in-app stack frame, read off disk at capture time — the Argus dashboard shows the actual broken code with the crashing line highlighted. No source maps, no configuration; `node_modules` frames are skipped and any read failure silently degrades to "no snippet". (Inherited from `@argusdev/sdk-node`, which this SDK builds on.)

MIT © Treasure Odetokun
