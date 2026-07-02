import {
  parseDsn,
  getIngestUrl,
  buildEnvelope,
  sendEnvelope,
  type EnvelopeOptions,
  type StackFrame,
} from "@argus/sdk-core";
import { parseStack } from "./stacktrace";

export interface InitOptions {
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

export function init(options: InitOptions): void {
  const parsed = parseDsn(options.dsn); /* throws on bad DSN — loudly, at startup */
  client = {
    url: getIngestUrl(parsed),
    publicKey: parsed.publicKey,
    environment: options.environment,
    release: options.release,
  };

  /* chain any handler the app already installed — we observe, never replace */
  const previousOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (error) {
      void captureException(error);
    } else {
      /* no Error object (e.g. cross-origin scripts) — build a frame from the args */
      const frame: StackFrame = {
        filename: source || "<unknown>",
        lineno: lineno || 1,
      };
      if (colno) frame.colno = colno;
      void send("Error", String(message), [frame], {});
    }
    if (previousOnError) {
      return previousOnError.call(window, message, source, lineno, colno, error);
    }
    return false; /* don't suppress the console error — devs still want to see it */
  };

  window.addEventListener("unhandledrejection", (event) => {
    void captureException(event.reason);
  });
}

export async function captureException(
  err: unknown,
  extra: EnvelopeOptions = {},
): Promise<void> {
  /* people reject(non-Error) all the time — normalize */
  const error = err instanceof Error ? err : new Error(String(err));

  let frames = parseStack(error.stack);
  if (frames.length === 0) {
    /* validator requires >= 1 frame — synthesize one rather than drop the event */
    frames = [{ filename: "<unknown>", lineno: 1 }];
  }

  await send(error.name, error.message, frames, extra);
}

async function send(
  type: string,
  value: string,
  frames: StackFrame[],
  extra: EnvelopeOptions,
): Promise<void> {
  if (!client) return; /* init() not called — silently no-op */

  const envelope = buildEnvelope(type, value, frames, {
    environment: client.environment,
    release: client.release,
    request: { url: window.location.href },
    ...extra,
  });

  await sendEnvelope(client.url, client.publicKey, envelope);
}
