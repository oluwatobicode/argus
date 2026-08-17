import {
  parseDsn,
  getIngestUrl,
  buildEnvelope,
  sendEnvelope,
  type EnvelopeOptions,
  type StackFrame,
} from "@argusdev/sdk-core";
import { parseStack } from "./stacktrace.js";

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
