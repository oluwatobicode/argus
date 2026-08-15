import { captureException } from "@argusdev/sdk-browser";
import { normalizeAngularError } from "./normalize.js";

/*
 * The Angular hook. Errors thrown inside Angular's zone are caught by zone.js
 * and routed to the `ErrorHandler` provider — they never reach window.onerror,
 * so this is the only reliable hook (same story as sdk-react's boundary).
 *
 * Usage (main.ts):
 *   import { ErrorHandler } from "@angular/core";
 *   import { init, ArgusErrorHandler } from "@argusdev/sdk-angular";
 *
 *   init({ dsn: "https://KEY@host/PROJECT_ID" });
 *
 *   bootstrapApplication(AppComponent, {
 *     providers: [{ provide: ErrorHandler, useClass: ArgusErrorHandler }],
 *   });
 *
 * Two deliberate choices:
 *   1. No import from @angular/core. This class is structurally assignable to
 *      Angular's ErrorHandler interface, so `useClass` typechecks without the
 *      dependency — the same trick sdk-node uses to avoid depending on express.
 *   2. Zero-arg constructor, no @Injectable(). Angular can instantiate it via
 *      useClass as-is, which keeps this package clear of Angular's decorator
 *      and TypeScript-version coupling. Call init() yourself before bootstrap.
 */
export class ArgusErrorHandler {
  /* `unknown` rather than Angular's `any` — method params are bivariant, so
     this still satisfies ErrorHandler while staying honest internally */
  handleError(error: unknown): void {
    const normalized = normalizeAngularError(error);

    void captureException(
      normalized.error,
      Object.keys(normalized.tags).length > 0
        ? { tags: normalized.tags }
        : {},
    );

    /* Angular's default handler logs to the console; providing our own
       silences it. Put it back — we observe, never absorb. */
    console.error(error);
  }
}
