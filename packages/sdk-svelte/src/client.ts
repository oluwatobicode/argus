import { captureException } from "@argusdev/sdk-browser";
import { contextFrom, shouldCapture, type ArgusErrorInput } from "./shared.js";

/* one import for the client half — init() is sdk-browser's (window.onerror,
   unhandled rejections, web vitals), and it's SSR-safe: hooks.client.ts is
   only evaluated in the browser, but nothing breaks if it isn't */
export { init, captureException } from "@argusdev/sdk-browser";
export type { InitOptions } from "@argusdev/sdk-browser";

/*
 * The client hook. Errors in `load` functions and during navigation are
 * caught by SvelteKit and routed to handleError in hooks.client.ts — they
 * never reach window.onerror (same story as every framework SDK here):
 *
 *   // hooks.client.ts
 *   import { init, handleErrorWithArgus } from "@argusdev/sdk-svelte/client";
 *
 *   init({ dsn: "https://KEY@host/PROJECT_ID" });
 *   export const handleError = handleErrorWithArgus();
 *
 * Wraps (never replaces) a handler you already have, preserving its return.
 */
export function handleErrorWithArgus<T extends ArgusErrorInput, R>(
  userHandler?: (input: T) => R,
): (input: T) => Promise<Awaited<R> | void> {
  return async (input: T): Promise<Awaited<R> | void> => {
    if (shouldCapture(input)) {
      const { tags } = contextFrom(input);
      /* request.url comes free from sdk-browser (window.location) */
      void captureException(input.error, { tags });
    }
    if (userHandler) {
      return (await userHandler(input)) as Awaited<R>;
    }
  };
}
