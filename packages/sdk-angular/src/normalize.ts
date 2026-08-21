/*
 * The "normalize" step for Angular. Where node/browser normalize a stack
 * STRING, Angular's problem is different: ErrorHandler is handed a wrapper far
 * more often than a plain Error.
 *
 *   - zone.js delivers unhandled promise rejections as { rejection: Error }
 *   - Angular stamps the original on `ngOriginalError` when it rethrows
 *   - HttpErrorResponse is Error-SHAPED but not an `instanceof Error`
 *
 * Unwrapped naively, all three fingerprint as "[object Object]" and collapse
 * into one useless Issue. This module digs out the real error and keeps the
 * HTTP metadata that was worth having off the wrapper.
 */

export interface NormalizedAngularError {
  error: Error;
  tags: Record<string, string>;
}

/* wrappers can nest (rejection → HttpErrorResponse → Error); bound the walk */
const MAX_DEPTH = 4;
const MAX_TAG_LENGTH = 200;

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  ngOriginalError?: unknown;
  rejection?: unknown;
  error?: unknown;
  status?: unknown;
  url?: unknown;
}

function isRecord(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

/* what a failed HTTP call is identified BY — kept aside for the synthetic
   frame below, not just for tags */
interface HttpMeta {
  url?: string;
  status?: number;
}

export function normalizeAngularError(input: unknown): NormalizedAngularError {
  const tags: Record<string, string> = {};
  const http: HttpMeta = {};
  let current: unknown = input;

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    if (!isRecord(current)) break;

    /* HttpErrorResponse metadata lives on the wrapper — grab it before we
       unwrap past it, because status + url ARE the story for a failed call */
    if (typeof current.status === "number") {
      http.status = current.status;
      tags.httpStatus = String(current.status);
    }
    if (typeof current.url === "string" && current.url) {
      http.url = current.url;
      tags.httpUrl = current.url.slice(0, MAX_TAG_LENGTH);
    }

    const next =
      current.ngOriginalError !== undefined
        ? current.ngOriginalError
        : current.rejection !== undefined
          ? current.rejection
          : current.error instanceof Error
            ? current.error
            : undefined;

    if (next === undefined) break;
    current = next;
  }

  return { error: toError(current, http), tags };
}

function toError(value: unknown, http: HttpMeta): Error {
  /* a real Error already carries a real stack — hands off */
  if (value instanceof Error) return value;

  const shaped =
    isRecord(value) && typeof value.message === "string" && value.message
      ? value
      : null;

  const error = new Error(
    shaped
      ? (shaped.message as string)
      : typeof value === "string" && value
        ? value
        : describe(value),
  );
  if (shaped && typeof shaped.name === "string" && shaped.name) {
    error.name = shaped.name;
  }

  /* a stack the wrapper carried itself (serialized errors, some polyfills) is
     real information — prefer it */
  if (shaped && typeof shaped.stack === "string" && shaped.stack) {
    error.stack = shaped.stack;
    return error;
  }

  /*
   * Otherwise `new Error()` above just captured OUR OWN stack: normalize.ts →
   * error-handler.ts → zone.js internals. Those frames are byte-identical for
   * every non-Error Angular throws, and the server fingerprints on frames
   * alone (filename:function:lineno, top 5 — see worker fingerprint.util.ts),
   * so leaving them in would fold every failed HTTP call in the app into one
   * meaningless Issue. Replace them with a single frame carrying what actually
   * distinguishes this error, so grouping lands per endpoint + status.
   */
  error.stack = syntheticStack(error.name, http);
  return error;
}

/*
 * Chrome/V8 frame format — the shape sdk-browser's parseStack reads.
 * Deliberately no "Name: message" header line: a message that happened to end
 * in ":<digits>:<digits>" would parse as a bogus extra frame and poison the
 * fingerprint.
 */
function syntheticStack(name: string, http: HttpMeta): string {
  const filename = http.url ? http.url.slice(0, MAX_TAG_LENGTH) : "<non-error>";
  /* lineno must be a positive int (validator); status 0 = network failure */
  const lineno = http.status && http.status > 0 ? http.status : 1;
  return `    at ${name} (${filename}:${lineno}:1)`;
}

/* last resort — anything is a better Issue title than "[object Object]" */
function describe(value: unknown): string {
  if (value === undefined) return "undefined thrown";
  if (value === null) return "null thrown";
  if (typeof value !== "object") return String(value);

  try {
    const json = JSON.stringify(value);
    if (json && json !== "{}") {
      return `Non-Error thrown: ${json.slice(0, MAX_TAG_LENGTH)}`;
    }
  } catch {
    /* circular or unserializable — fall through */
  }
  return "Non-Error thrown (no message)";
}
