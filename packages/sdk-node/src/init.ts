import {
  parseDsn,
  getIngestUrl,
  buildEnvelope,
  sendEnvelope,
  type EnvelopeOptions,
} from "@argusdev/sdk-core";
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

  process.on("uncaughtException", (err: Error) => {
    /* capture, wait for the send, then exit non-zero — after an uncaught
       exception the process state is untrustworthy; Node docs say exit. */
    void captureException(err).finally(() => process.exit(1));
  });

  process.on("unhandledRejection", (reason: unknown) => {
    void captureException(reason);
  });
}

export async function captureException(
  err: unknown,
  extra: EnvelopeOptions = {},
): Promise<void> {
  if (!client) return; /* init() not called — silently no-op */

  /* people reject(non-Error) all the time — normalize */
  const error = err instanceof Error ? err : new Error(String(err));

  let frames = parseStack(error.stack);
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
