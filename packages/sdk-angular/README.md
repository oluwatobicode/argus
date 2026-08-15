# @argusdev/sdk-angular

Angular SDK for [Argus](https://github.com/oluwatobicode/argus) — an `ErrorHandler` provider on top of `@argusdev/sdk-browser`. Catches everything zone.js swallows, and unwraps Angular's error wrappers so you get the real bug instead of `[object Object]`.

## Install

```bash
npm install @argusdev/sdk-angular
```

## Usage

```ts
// main.ts
import { ErrorHandler } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { init, ArgusErrorHandler } from "@argusdev/sdk-angular";
import { AppComponent } from "./app/app.component";

init({ dsn: "https://<publicKey>@<host>/<projectId>" });

bootstrapApplication(AppComponent, {
  providers: [{ provide: ErrorHandler, useClass: ArgusErrorHandler }],
});
```

NgModule apps use the same provider:

```ts
@NgModule({
  providers: [{ provide: ErrorHandler, useClass: ArgusErrorHandler }],
})
export class AppModule {}
```

`init()` covers the global handlers (`window.onerror`, unhandled rejections, web vitals); the provider covers everything inside Angular's zone. You want both — errors from third-party scripts only hit the former, component errors only the latter.

Manual capture:

```ts
import { captureException } from "@argusdev/sdk-angular";

this.http.get("/api/me").subscribe({
  error: (err) => captureException(err),
});
```

## Options

Same as `@argusdev/sdk-browser`:

| Option        | Default    | What                                          |
| ------------- | ---------- | --------------------------------------------- |
| `dsn`         | _required_ | `https://KEY@host/PROJECT_ID`                 |
| `environment` | —          | e.g. `"production"`                           |
| `release`     | —          | version string, for regression tracking       |
| `vitals`      | `true`     | `page.load` transaction with LCP/CLS/FCP/TTFB |

## What the unwrapping buys you

Angular rarely hands `ErrorHandler` a plain `Error`. It hands it a wrapper:

| What arrives                     | Where the real error hides |
| -------------------------------- | -------------------------- |
| unhandled promise rejection      | `{ rejection: Error }` (zone.js)  |
| Angular rethrow                  | `error.ngOriginalError`    |
| `HttpErrorResponse`              | Error-**shaped**, but not `instanceof Error` |

Left alone, all three stringify to `[object Object]` and fingerprint into a single meaningless Issue. `normalizeAngularError()` walks the chain (up to 4 levels), pulls out the innermost real error, and keeps the metadata that mattered off the wrapper:

- `httpStatus` — e.g. `"500"`
- `httpUrl` — the failed request URL (truncated to 200 chars)

For `HttpErrorResponse` the wrapper's own `name`/`message` are kept, because they're already the useful sentence: `Http failure response for /api/users: 500 Internal Server Error`.

The helper is exported if you want it independently:

```ts
import { normalizeAngularError } from "@argusdev/sdk-angular";

const { error, tags } = normalizeAngularError(caught);
```

## No `@angular/core` dependency

This package doesn't import Angular. `ArgusErrorHandler` is *structurally* assignable to Angular's `ErrorHandler` interface, so `useClass` typechecks against whatever version you have — the same approach `@argusdev/sdk-node` uses to ship Express middleware without depending on Express.

It also has a zero-argument constructor and no `@Injectable()` decorator: Angular instantiates it via `useClass` as-is, and the package stays clear of Angular's decorator/TypeScript-version coupling. That's why `init()` is a separate call in `main.ts` rather than an argument to the provider.

Angular's default handler logs to the console. Providing your own silences that, so `ArgusErrorHandler` re-logs — we observe, never absorb.

MIT © Treasure Odetokun
