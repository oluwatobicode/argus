import {
  parseDsn,
  getIngestUrl,
  buildEnvelope,
  sendEnvelope,
  type EnvelopeOptions,
  type StackFrame,
} from "@argusdev/sdk-core";
import { parseStack } from "./stacktrace.js";
import { contextFrom, shouldCapture, type ArgusErrorInput } from "./shared.js";

export interface ServerInitOptions {
  dsn: string;
  environment?: string;
  release?: string;
}

/* set once by init(); null means "not initialized — do nothing, never crash" */
let client: {
  url: string;
  publicKey: string;
  environment?: string;
  release?: string;
} | null = null;

/*
 * Call once in hooks.server.ts (module scope). No process hooks: SvelteKit
 * catches request errors and renders its error page, so they never become an
 * uncaughtException — handleError below is the real hook. (Also: `process`
 * doesn't exist on edge deployments.)
 */
export function init(options: ServerInitOptions): void {
  const parsed = parseDsn(options.dsn); /* throws on bad DSN — loudly, at startup */
  client = {
    url: getIngestUrl(parsed),
    publicKey: parsed.publicKey,
    environment: options.environment,
    release: options.release,
  };
}

export async function captureException(
  err: unknown,
  extra: EnvelopeOptions = {},
): Promise<void> {
  if (!client) return; /* init() not called — silently no-op */

  const error = err instanceof Error ? err : new Error(String(err));

  let frames: StackFrame[] = parseStack(error.stack);
  if (frames.length === 0) {
    /* validator requires >= 1 frame — synthesize one rather than drop the event */
    frames = [{ filename: "<unknown>", lineno: 1 }];
  }

  const envelope = buildEnvelope(error.name, error.message, frames, {
    environment: client.environment,
    release: client.release,
    ...extra,
  });

  await sendEnvelope(client.url, client.publicKey, envelope);
}

/*
 * The server hook. SvelteKit routes every unexpected server error (load
 * functions, form actions, endpoints, rendering) through handleError — they
 * never reach process-level handlers, so this wrapper is the only way in:
 *
 *   // hooks.server.ts
 *   import { init, handleErrorWithArgus } from "@argusdev/sdk-svelte/server";
 *
 *   init({ dsn: ARGUS_DSN });
 *   export const handleError = handleErrorWithArgus();
 *
 * A pre-existing handler keeps working — pass it in and its return value
 * (the shape your $page.error gets) is preserved:
 *
 *   export const handleError = handleErrorWithArgus(({ error, event }) => {
 *     return { message: "Whoops" };
 *   });
 *
 * 404s (unmatched routes) are skipped — traffic noise, not crashes.
 */
export function handleErrorWithArgus<T extends ArgusErrorInput, R>(
  userHandler?: (input: T) => R,
): (input: T) => Promise<Awaited<R> | void> {
  return async (input: T): Promise<Awaited<R> | void> => {
    if (shouldCapture(input)) {
      const { tags, request } = contextFrom(input);
      void captureException(input.error, { tags, ...(request ? { request } : {}) });
    }
    if (userHandler) {
      return (await userHandler(input)) as Awaited<R>;
    }
  };
}
